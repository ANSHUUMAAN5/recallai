from fastapi import FastAPI
from pydantic import BaseModel
import httpx

from sentence_transformers import SentenceTransformer


# =========================================================
# FastAPI
# =========================================================

app = FastAPI(
    title="RecallAI API"
)


# =========================================================
# Configuration
# =========================================================

VECTOR_ENGINE_URL = "http://localhost:8081"

EMBEDDING_MODEL_NAME = (
    "sentence-transformers/all-MiniLM-L6-v2"
)


# =========================================================
# Embedding Model
# =========================================================

print("Loading embedding model...")

model = SentenceTransformer(
    EMBEDDING_MODEL_NAME
)

print("Embedding model loaded.")


# =========================================================
# Request Models
# =========================================================

class SearchRequest(BaseModel):
    query: str
    k: int = 5
    algorithm: str = "hnsw"
    metric: str = "cosine"


# =========================================================
# GET /health
# =========================================================

@app.get("/health")
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

    async with httpx.AsyncClient() as client:

        response = await client.get(
            f"{VECTOR_ENGINE_URL}/health"
        )

    return response.json()


# =========================================================
# POST /documents
#
# Creates a demo document,
# generates a 384-D embedding,
# and sends it to the C++ Vector Engine.
# =========================================================

@app.post("/documents")
async def add_document():

    # -----------------------------------------------------
    # Demo document
    # -----------------------------------------------------

    document_id = 100

    text = (
        "RecallAI is a vector search and "
        "retrieval system."
    )

    source = "demo.txt"

    page = 1

    chunk = 1


    # -----------------------------------------------------
    # Generate embedding
    # -----------------------------------------------------

    embedding = model.encode(
        text
    )


    # NumPy array -> Python list
    vector = embedding.tolist()


    # -----------------------------------------------------
    # Validate dimension
    # -----------------------------------------------------

    if len(vector) != 384:

        raise ValueError(
            f"Expected 384-dimensional embedding, "
            f"got {len(vector)}"
        )


    # -----------------------------------------------------
    # Convert vector to comma-separated string
    #
    # IMPORTANT:
    # This goes into the HTTP BODY.
    # It does NOT go into the URL.
    # -----------------------------------------------------

    vector_string = ",".join(
        str(value)
        for value in vector
    )


    # -----------------------------------------------------
    # Metadata only
    # -----------------------------------------------------

    params = {
        "id": document_id,
        "text": text,
        "source": source,
        "page": page,
        "chunk": chunk
    }


    # -----------------------------------------------------
    # Send to C++ Vector Engine
    # -----------------------------------------------------

    async with httpx.AsyncClient() as client:

        response = await client.post(
            f"{VECTOR_ENGINE_URL}/insert",

            # Small metadata in URL
            params=params,

            # Large 384-D vector in BODY
            content=vector_string
        )


    # -----------------------------------------------------
    # Return C++ response
    # -----------------------------------------------------

    return {
        "cpp_status": response.status_code,
        "cpp_response": response.text
    }


# =========================================================
# POST /search
#
# User query
#      ↓
# MiniLM
#      ↓
# 384-D embedding
#      ↓
# C++ HNSW
#      ↓
# nearest documents
# =========================================================

@app.post("/search")
async def search_documents(
    request: SearchRequest
):

    # -----------------------------------------------------
    # Generate embedding for user's query
    # -----------------------------------------------------

    embedding = model.encode(
        request.query
    )


    # NumPy array -> Python list
    query_vector = embedding.tolist()


    # -----------------------------------------------------
    # Validate dimension
    # -----------------------------------------------------

    if len(query_vector) != 384:

        raise ValueError(
            f"Expected 384-dimensional query embedding, "
            f"got {len(query_vector)}"
        )


    # -----------------------------------------------------
    # Convert embedding to comma-separated string
    # -----------------------------------------------------

    query_string = ",".join(
        str(value)
        for value in query_vector
    )


    # -----------------------------------------------------
    # Send search request to C++ Vector Engine
    #
    # IMPORTANT:
    #
    # k
    # algorithm
    # metric
    #
    # go into URL parameters.
    #
    # The 384-D query vector goes ONLY into
    # the HTTP request BODY.
    #
    # DO NOT put query_string into params.
    # -----------------------------------------------------

    async with httpx.AsyncClient() as client:

        response = await client.post(
            f"{VECTOR_ENGINE_URL}/search",

            params={
                "k": request.k,
                "algorithm": request.algorithm,
                "metric": request.metric
            },

            content=query_string
        )


    # -----------------------------------------------------
    # Return C++ response
    #
    # We intentionally use response.text here while
    # debugging so a non-JSON C++ response doesn't cause
    # another Python 500 error.
    # -----------------------------------------------------

    return {
        "cpp_status": response.status_code,
        "cpp_response": response.text
    }