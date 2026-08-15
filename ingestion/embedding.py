import os

# The Rust tokenizer backing SentenceTransformer runs its own
# internal thread pool. Called from more than one Python thread at
# once (the API uses asyncio.to_thread for every embedding call), the
# two thread pools contend and can hang outright — this must be set
# before the tokenizer is ever touched, so it's here before the
# sentence_transformers import.
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import threading

import torch
from sentence_transformers import SentenceTransformer

# By default PyTorch also grabs every CPU core for each individual
# inference call's internal BLAS/OMP parallelism, which compounds the
# problem below.
torch.set_num_threads(1)


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

model = SentenceTransformer(MODEL_NAME)

# The API calls into this model from multiple OS threads at once (the
# FastAPI layer wraps every embedding call in asyncio.to_thread — see
# api/main.py — so e.g. /search and /vectors/projection firing
# together for one query hit the model concurrently). Genuinely
# concurrent calls into the same SentenceTransformer instance were
# observed to hang or crash the process outright (SIGABRT) — this
# looks like a thread-safety issue in the tokenizer/torch native
# code, not something TOKENIZERS_PARALLELISM or set_num_threads fully
# resolves. Serializing access with a lock trades away parallelism
# for correctness; on Render's free tier (effectively one shared
# core) that parallelism wasn't buying real throughput anyway.
_model_lock = threading.Lock()


def generate_embedding(text: str) -> list[float]:
    """
    Generate a semantic embedding for a piece of text.
    """

    with _model_lock:

        embedding = model.encode(
            text,
            normalize_embeddings=True
        )

    return embedding.tolist()


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for many texts in a single batched call.

    Much faster than calling generate_embedding() in a loop — a
    single batched forward pass instead of one Python-level model
    call per chunk.
    """

    with _model_lock:

        embeddings = model.encode(
            texts,
            normalize_embeddings=True
        )

    return embeddings.tolist()


if __name__ == "__main__":
    text = "RecallAI is a vector search and retrieval system."

    embedding = generate_embedding(text)

    print("Model:", MODEL_NAME)
    print("Dimensions:", len(embedding))
    print("First 5 values:", embedding[:5])