from sentence_transformers import SentenceTransformer


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

model = SentenceTransformer(MODEL_NAME)


def generate_embedding(text: str) -> list[float]:
    """
    Generate a semantic embedding for a piece of text.
    """

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