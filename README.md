# RecallAI

A self-hosted RAG (Retrieval-Augmented Generation) document Q&A system,
built around a custom vector database written from scratch in C++.

Upload a PDF or TXT file, ask questions about it, get grounded answers
with citations back to the source page/chunk — no hallucinating outside
the uploaded documents.

## Architecture

```
                         User
                          │
                          ▼
                 ┌──────────────────┐
                 │   FastAPI (API)  │  :8000
                 │  api/main.py     │
                 └────────┬─────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
     ┌────────────┐ ┌───────────┐ ┌───────────┐
     │  Ingestion │ │    RAG    │ │  Search   │
     │  pipeline  │ │ pipeline  │ │  client   │
     └──────┬─────┘ └─────┬─────┘ └─────┬─────┘
            │             │             │
            │        ┌────▼────┐        │
            │        │   LLM   │        │
            │        │ Ollama /│        │
            │        │ Claude  │        │
            │        └─────────┘        │
            │                           │
            └─────────────┬─────────────┘
                          ▼
              ┌────────────────────────┐
              │  C++ Vector Engine     │  :8081
              │  BruteForce/KDTree/HNSW│
              │  vector-engine/        │
              └────────────────────────┘
```

- **`vector-engine/`** — Standalone C++ HTTP server exposing a
  hand-built vector database. Three search algorithms implemented from
  scratch: brute-force (exact), KD-tree, and HNSW (approximate nearest
  neighbor, the algorithm production vector DBs use). Supports cosine,
  euclidean, and manhattan distance. Persists to disk.
- **`ingestion/`** — PDF/TXT loaders → chunker (with overlap) →
  `sentence-transformers/all-MiniLM-L6-v2` embeddings (384-D) → pushed
  into the C++ engine.
- **`rag/`** — Retrieval + grounded prompt construction + LLM call.
  Provider-agnostic: local Ollama or the hosted Claude API.
- **`api/`** — FastAPI layer tying it all together.

## Requirements

- Python 3.11+
- A C++17 compiler (clang/g++) + CMake 3.16+
- [Ollama](https://ollama.com) running locally (for the default local LLM path)
- Docker + Docker Compose (optional, for containerized run)

## Setup

### 1. Configure environment

```bash
cp .env.example .env
```

Defaults work for local/native development. See [Environment
variables](#environment-variables) below for what each one does.

### 2. Build the vector engine

```bash
cd vector-engine
cmake -S . -B build
cmake --build build -j
```

### 3. Install Python dependencies

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Pull the local LLM (if using Ollama)

```bash
ollama pull qwen2.5:3b
```

### 5. Run all three services (native)

```bash
# Terminal 1 — vector engine (must run from vector-engine/, it persists to ./data)
cd vector-engine && ./build/recallai-engine

# Terminal 2 — Ollama (skip if LLM_PROVIDER=claude)
ollama serve

# Terminal 3 — API (from repo root, with the venv active)
source api/.venv/bin/activate
uvicorn api.main:app --reload
```

### Or: run with Docker Compose

```bash
docker compose up --build
```

This starts the vector engine and API in containers. Ollama is **not**
containerized — on macOS, Ollama in Docker loses GPU acceleration, so
keep it running natively on the host (`ollama serve`); the API
container reaches it via `host.docker.internal`. If you'd rather not
run Ollama at all, set `LLM_PROVIDER=claude` and add an
`ANTHROPIC_API_KEY` in `.env` instead.

## API reference

| Method | Path                 | Description                                  |
|--------|----------------------|-----------------------------------------------|
| GET    | `/health`            | API health check                              |
| GET    | `/vector-engine/health` | Proxies health check to the C++ engine     |
| POST   | `/documents/upload`  | Upload a PDF/TXT, chunk + embed + index it    |
| POST   | `/search`            | Raw vector search, returns top-k chunks       |
| POST   | `/ask`                | Full RAG: search + grounded LLM answer + sources |

Example:

```bash
curl -X POST http://localhost:8000/documents/upload \
  -F "file=@examples/Journey_Through_Hindu_Wisdom.pdf"

curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is dharma?", "k": 3}'
```

## Environment variables

| Variable            | Default                         | Purpose |
|----------------------|----------------------------------|---------|
| `VECTOR_ENGINE_URL`  | `http://localhost:8081`          | Where the API reaches the C++ engine |
| `LLM_PROVIDER`       | `ollama`                         | `ollama` (local) or `claude` (hosted) |
| `OLLAMA_URL`         | `http://localhost:11434`         | Ollama server address |
| `OLLAMA_MODEL`       | `qwen2.5:3b`                     | Local model to use |
| `ANTHROPIC_API_KEY`  | *(empty)*                        | Required only if `LLM_PROVIDER=claude` |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-5`               | Claude model to use |

## Testing the vector engine

```bash
cd vector-engine
./build/test_brute
./build/test_hnsw
./build/test_vector_db   # note: writes to the real ./data/vectors.db
```
