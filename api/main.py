from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import asyncio
import httpx
import numpy as np
import os
import tempfile

from dotenv import load_dotenv

from rag.rag_pipeline import answer_question
from rag.llm_client import OLLAMA_MODEL, ANTHROPIC_MODEL, GEMINI_MODEL
from ingestion.pipeline import ingest_document
from ingestion.embedding import generate_embedding

load_dotenv()


# =========================================================
# FastAPI
# =========================================================

app = FastAPI(
    title="RecallAI API"
)


# =========================================================
# Configuration
# =========================================================

VECTOR_ENGINE_URL = os.environ.get(
    "VECTOR_ENGINE_URL",
    "http://localhost:8081"
)

if not VECTOR_ENGINE_URL.startswith("http"):
    # Some hosts (e.g. Render's `fromService` hostport) provide
    # "host:port" with no scheme.
    VECTOR_ENGINE_URL = f"http://{VECTOR_ENGINE_URL}"

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Retrying vector-engine request helper
#
# Render's free tier spins the vector engine down after ~15 min
# idle; waking it back up can take 30-60s and shows up as
# connection errors or 502/503/504 responses in the meantime —
# not something a single short-timeout request can ride out. Retry
# with backoff instead of failing on the first attempt.
# =========================================================

_ENGINE_ATTEMPTS = 5
_ENGINE_TIMEOUT = 15
_ENGINE_BACKOFF_SECONDS = 5


async def vector_engine_request(
    method: str,
    path: str,
    **kwargs,
) -> httpx.Response:

    last_error: Exception | None = None

    for attempt in range(_ENGINE_ATTEMPTS):

        try:

            async with httpx.AsyncClient() as client:

                response = await client.request(
                    method,
                    f"{VECTOR_ENGINE_URL}{path}",
                    timeout=_ENGINE_TIMEOUT,
                    **kwargs,
                )

            if response.status_code >= 500:

                # Any 5xx — not just 502/503/504 — is treated as
                # "infrastructure isn't ready yet" during a cold
                # start. A narrower allowlist was observed to miss
                # a real case: the engine/Render's proxy returning
                # some other 5xx mid-startup, which fell through as
                # a hard failure instead of being retried.
                last_error = httpx.HTTPStatusError(
                    f"{response.status_code} from vector engine",
                    request=response.request,
                    response=response,
                )

            else:

                # A 2xx/3xx/4xx (including a normal 4xx like
                # "document not found") is returned as-is — it's a
                # real response from a live engine, not a cold-start
                # symptom, so it's not retried here. Each caller
                # decides whether to raise_for_status() itself.
                return response

        except httpx.TransportError as error:

            last_error = error

        if attempt < _ENGINE_ATTEMPTS - 1:

            await asyncio.sleep(_ENGINE_BACKOFF_SECONDS)

    raise last_error


# =========================================================
# Request Models
# =========================================================

class SearchRequest(BaseModel):

    query: str
    k: int = 5
    algorithm: str = "hnsw"
    metric: str = "cosine"


class AskRequest(BaseModel):

    question: str
    k: int = 3


class ProjectionRequest(BaseModel):

    query: str | None = None


# =========================================================
# GET /health
#
# Also answers HEAD — uptime monitors (e.g. UptimeRobot) default
# to HEAD requests to save bandwidth, and a GET-only route 405s
# those, which reads as "down" even though the service is fine.
# =========================================================

@app.get("/health")
@app.head("/health")
async def health():

    return {
        "status": "ok",
        "service": "RecallAI API"
    }


# =========================================================
# GET /vector-engine/health
# =========================================================

@app.get("/vector-engine/health")
async def vector_engine_health():

    response = await vector_engine_request("GET", "/health")

    response.raise_for_status()

    return response.json()


# =========================================================
# GET /config
#
# Non-secret runtime info for the frontend (status pill,
# Settings page).
# =========================================================

@app.get("/config")
async def config():

    provider = os.environ.get(
        "LLM_PROVIDER",
        "ollama"
    ).lower()

    model = {
        "ollama": OLLAMA_MODEL,
        "claude": ANTHROPIC_MODEL,
        "gemini": GEMINI_MODEL,
    }.get(provider, "")

    return {
        "llm_provider": provider,
        "llm_model": model,
    }


# =========================================================
# GET /stats
# =========================================================

@app.get("/stats")
async def stats():

    response = await vector_engine_request("GET", "/stats")

    response.raise_for_status()

    return response.json()


# =========================================================
# GET /documents
# =========================================================

@app.get("/documents")
async def list_documents():

    response = await vector_engine_request("GET", "/documents")

    response.raise_for_status()

    return response.json()


# =========================================================
# DELETE /documents/{document_id}
# =========================================================

@app.delete("/documents/{document_id}")
async def delete_document(document_id: int):

    response = await vector_engine_request(
        "DELETE",
        f"/documents/{document_id}",
    )

    return response.json()


# =========================================================
# GET /vectors
# =========================================================

@app.get("/vectors")
async def list_vectors():

    response = await vector_engine_request("GET", "/vectors")

    response.raise_for_status()

    return response.json()


# =========================================================
# POST /vectors/projection
#
# Reduce every stored embedding (384-D) down to 3-D via PCA,
# for the Vector Lab visualization.
#
# The PCA basis is fit on the corpus only. If a query is
# given, it's embedded and projected through that same basis
# (never re-fit including the query) so query/corpus
# positions stay comparable.
# =========================================================

@app.post("/vectors/projection")
async def vectors_projection(
    request: ProjectionRequest
):

    response = await vector_engine_request("GET", "/vectors")

    response.raise_for_status()

    vectors = response.json()["vectors"]

    if not vectors:

        return {
            "points": [],
            "query": None,
        }


    # -----------------------------------------------------
    # Fit PCA on the corpus
    # -----------------------------------------------------

    matrix = np.array(
        [record["vector"] for record in vectors],
        dtype=np.float64,
    )

    mean = matrix.mean(axis=0)

    centered = matrix - mean

    num_components = min(3, centered.shape[0], centered.shape[1])

    _, _, components = np.linalg.svd(
        centered,
        full_matrices=False,
    )

    basis = components[:num_components]

    coords = centered @ basis.T


    # -----------------------------------------------------
    # Build points
    # -----------------------------------------------------

    points = []

    for record, coord in zip(vectors, coords):

        point = {
            "id": record["id"],
            "document_id": record["document_id"],
            "text": record["text"],
            "source": record["source"],
            "page": record["page"],
            "chunk": record["chunk"],
            "x": float(coord[0]),
            "y": float(coord[1]) if num_components > 1 else 0.0,
            "z": float(coord[2]) if num_components > 2 else 0.0,
        }

        points.append(point)


    # -----------------------------------------------------
    # Project the query through the same basis
    # -----------------------------------------------------

    query_point = None

    if request.query:

        embedding = await asyncio.to_thread(
            generate_embedding, request.query
        )

        query_vector = np.array(
            embedding,
            dtype=np.float64,
        )

        query_coord = (query_vector - mean) @ basis.T

        query_point = {
            "x": float(query_coord[0]),
            "y": float(query_coord[1]) if num_components > 1 else 0.0,
            "z": float(query_coord[2]) if num_components > 2 else 0.0,
        }


    return {
        "points": points,
        "query": query_point,
    }


# =========================================================
# POST /documents/upload
#
# User uploads PDF/TXT
#
# Flow:
#
# PDF/TXT
#    ↓
# FastAPI
#    ↓
# Temporary file
#    ↓
# ingestion.pipeline
#    ↓
# Create Document
#    ↓
# Extract text
#    ↓
# Chunk
#    ↓
# Embeddings
#    ↓
# C++ VectorDB
#    ↓
# Persistent vectors.db
# =========================================================

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    # -----------------------------------------------------
    # Validate filename
    # -----------------------------------------------------

    if not file.filename:

        return {
            "error": "Filename is required"
        }


    # -----------------------------------------------------
    # Get extension
    # -----------------------------------------------------

    extension = os.path.splitext(
        file.filename
    )[1].lower()


    # -----------------------------------------------------
    # Validate file type
    # -----------------------------------------------------

    if extension not in [".pdf", ".txt"]:

        return {
            "error": (
                "Only PDF and TXT files are supported"
            )
        }


    temp_path = None


    try:

        # -------------------------------------------------
        # Save uploaded file temporarily
        # -------------------------------------------------

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:

            temp_path = temp_file.name

            contents = await file.read()

            temp_file.write(contents)


        # -------------------------------------------------
        # Run ingestion pipeline
        #
        # The pipeline now:
        #
        # 1. Creates DocumentRecord
        # 2. Extracts text
        # 3. Creates chunks
        # 4. Generates embeddings
        # 5. Inserts VectorRecords
        # -------------------------------------------------

        results = await asyncio.to_thread(
            ingest_document,
            file_path=temp_path,
            source=file.filename
        )


        # -------------------------------------------------
        # Get document ID
        # -------------------------------------------------

        document_id = None

        if results:

            document_id = results[0].get(
                "document_id"
            )


        # -------------------------------------------------
        # Return result
        # -------------------------------------------------

        return {
            "status": "success",
            "document_id": document_id,
            "filename": file.filename,
            "chunks_inserted": len(results),

            "chunks": [
                {
                    "id": result["id"],
                    "document_id": result["document_id"],
                    "page": result["page"],
                    "chunk": result["chunk"]
                }

                for result in results
            ]
        }


    finally:

        # -------------------------------------------------
        # Remove temporary file
        # -------------------------------------------------

        if (
            temp_path
            and os.path.exists(temp_path)
        ):

            os.remove(temp_path)


# =========================================================
# POST /search
#
# User query
#    ↓
# MiniLM
#    ↓
# 384-D embedding
#    ↓
# C++ Vector Engine
#    ↓
# HNSW / KDTree / BruteForce
#    ↓
# Relevant chunks
# =========================================================

@app.post("/search")
async def search_documents(
    request: SearchRequest
):

    # -----------------------------------------------------
    # Generate embedding
    # -----------------------------------------------------

    query_vector = await asyncio.to_thread(
        generate_embedding,
        request.query
    )


    # -----------------------------------------------------
    # Validate dimension
    # -----------------------------------------------------

    if len(query_vector) != 384:

        raise ValueError(
            "Expected 384-dimensional query embedding, "
            f"got {len(query_vector)}"
        )


    # -----------------------------------------------------
    # Convert vector to string
    # -----------------------------------------------------

    query_string = ",".join(
        str(value)
        for value in query_vector
    )


    # -----------------------------------------------------
    # Send to C++ Vector Engine
    # -----------------------------------------------------

    response = await vector_engine_request(
        "POST",
        "/search",

        params={
            "k": request.k,
            "algorithm": request.algorithm,
            "metric": request.metric
        },

        content=query_string,
    )


    # -----------------------------------------------------
    # Return parsed C++ response
    # -----------------------------------------------------

    response.raise_for_status()

    return response.json()


# =========================================================
# POST /ask
#
# Full RAG pipeline
#
# Question
#    ↓
# MiniLM
#    ↓
# Vector Search
#    ↓
# Relevant chunks
#    ↓
# Context
#    ↓
# Ollama Qwen
#    ↓
# Grounded answer
# =========================================================

@app.post("/ask")
async def ask_question(
    request: AskRequest
):

    result = await asyncio.to_thread(
        answer_question,
        question=request.question,
        k=request.k
    )

    return result