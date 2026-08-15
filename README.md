# RecallAI

A self-hosted RAG (Retrieval-Augmented Generation) document Q&A system,
built around a custom vector database written from scratch in C++.

Upload a PDF or TXT file, ask questions about it, get grounded answers
with citations back to the source page/chunk — no hallucinating outside
the uploaded documents.

**Live demo**: https://recallai-frontend.onrender.com
(free-tier hosting — see [Deploying](#deploying-free-tier) for the
tradeoffs: uploaded documents don't persist across backend restarts,
and the vector engine has no auth, so don't upload anything sensitive)

## Highlights

- **Vector search engine written from scratch in C++** — brute-force
  (exact), KD-tree, and HNSW (the approximate-nearest-neighbor
  algorithm production vector databases actually use), not a wrapper
  around Pinecone/pgvector/FAISS
- **Provider-agnostic LLM layer** — local Ollama, Claude, or Gemini
  behind one interface, switched with an env var
- **Grounded RAG with a deliberate fallback rule**: answers are
  strictly grounded in your uploaded documents when any exist; if
  nothing is indexed at all, it falls back to a clearly-labeled
  general-knowledge answer instead of a flat refusal — an explicit
  design choice, not a hallucination bug (see `rag/rag_pipeline.py`)
- **Live 3D visualization** of the embedding space (PCA-projected,
  `@react-three/fiber`) that highlights the *real* HNSW/cosine nearest
  neighbors for whatever you search or ask — not just visual proximity
- Deployed end-to-end (C++ engine + FastAPI + Next.js) on free-tier
  infrastructure, with the real engineering tradeoffs that come with
  that documented below, not hidden

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
  Provider-agnostic: local Ollama, hosted Claude, or hosted Gemini.
- **`api/`** — FastAPI layer tying it all together.
- **`frontend/`** — Next.js (App Router) + TypeScript + Tailwind UI,
  built as a static export (no Node server needed at runtime). A
  single persistent workspace, not separate pages: an interactive 3D
  view of the embedding space (PCA-projected) stays mounted at all
  times in the center, a left panel of shared controls
  (algorithm/metric/top-k) drives it, and a tabbed right panel
  (Overview / Search / Documents / Ask AI / Settings) switches content
  without ever navigating away — running a search or asking a
  question highlights its real HNSW/cosine results live in the same
  3D view. Documents can be added by file upload or by pasting text
  directly.

## Requirements

- Python 3.11+
- A C++17 compiler (clang/g++) + CMake 3.16+
- Node.js 20+ (for the frontend)
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

# Terminal 4 — frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Then open `http://localhost:3000`.

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

The frontend is not part of `docker-compose.yml` — run it natively
with `npm run dev` (see above).

### Deploying (free tier)

`render.yaml` deploys all three pieces to [Render](https://render.com)
as a single Blueprint (dashboard → New → Blueprint → select this
repo): `recallai-engine` and `recallai-api` as Docker web services,
and `recallai-frontend` as a free static site (the frontend builds
with `output: "export"` in `next.config.ts` — every page is
client-rendered against the external API with no Next.js
server-side data fetching, so a static export needs no Node server:
no cold starts, no sleep-on-inactivity, unlike the two Docker
services). Prod uses `LLM_PROVIDER=gemini` (free API tier, unlike
Claude) since Render's free plan has no GPU.

**Known tradeoff**: Render's free plan doesn't support private
services, so `recallai-engine` (the C++ vector database) gets a public
URL like any other free-tier service. It has **no built-in
authentication** — anyone with the URL can read, insert, or delete
data. Acceptable for a demo with non-sensitive content; if this
becomes a real product, add an auth header check to
`vector-engine/src/server.cpp` before relying on it. Free-tier
services also have ephemeral disk, so uploaded documents don't survive
a restart/redeploy.

## API reference

| Method | Path                    | Description                                  |
|--------|-------------------------|-----------------------------------------------|
| GET    | `/health`               | API health check                              |
| GET    | `/vector-engine/health` | Proxies health check to the C++ engine        |
| GET    | `/config`               | Non-secret runtime info (LLM provider/model)  |
| GET    | `/stats`                | Vector count                                  |
| GET    | `/documents`            | List all documents                            |
| DELETE | `/documents/{id}`       | Delete a document and its chunks              |
| POST   | `/documents/upload`     | Upload a PDF/TXT, chunk + embed + index it     |
| GET    | `/vectors`              | All vectors with embeddings (Vector Lab data source) |
| POST   | `/vectors/projection`   | Corpus + optional query, PCA-reduced to 3D     |
| POST   | `/search`               | Raw vector search, returns top-k chunks        |
| POST   | `/ask`                  | Full RAG: search + grounded LLM answer + sources |

`/ask` responses include a `grounded` boolean. If nothing is indexed
at all, it falls back to a general-knowledge answer instead of
refusing, with `grounded: false` and no `sources` — see
`rag/rag_pipeline.py`.

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
| `GEMINI_API_KEY`     | *(empty)*                        | Required only if `LLM_PROVIDER=gemini` — free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL`       | `gemini-flash-lite-latest`       | Gemini model to use |
| `ALLOWED_ORIGINS`    | `http://localhost:3000`          | Comma-separated CORS origins allowed to call the API |

`frontend/.env.local` uses its own variable:
`NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).

## Testing the vector engine

```bash
cd vector-engine
./build/test_brute
./build/test_hnsw
./build/test_vector_db   # note: writes to the real ./data/vectors.db
```
