from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

import httpx
import os
import tempfile

from dotenv import load_dotenv

from rag.rag_pipeline import answer_question
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
            f"{VECTOR_ENGINE_URL}/health",
            timeout=5
        )

    response.raise_for_status()

    return response.json()


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

        results = ingest_document(
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

    query_vector = generate_embedding(
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

    async with httpx.AsyncClient() as client:

        response = await client.post(
            f"{VECTOR_ENGINE_URL}/search",

            params={
                "k": request.k,
                "algorithm": request.algorithm,
                "metric": request.metric
            },

            content=query_string,

            timeout=30
        )


    # -----------------------------------------------------
    # Return C++ response
    # -----------------------------------------------------

    return {
        "cpp_status": response.status_code,
        "cpp_response": response.text
    }


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

    result = answer_question(
        question=request.question,
        k=request.k
    )

    return result