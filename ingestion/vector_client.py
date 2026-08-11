import httpx

from ingestion.embedding import generate_embedding


VECTOR_ENGINE_URL = "http://localhost:8081"


def insert_vector(
    vector_id: int,
    vector: list[float],
    text: str,
    source: str = "",
    page: int = 1,
    chunk: int = 1,
):
    """
    Insert a 384-dimensional vector into the C++ Vector Engine.

    The vector is sent in the HTTP request body rather than
    the URL because a 384-dimensional embedding is too large
    for a URL.
    """

    if len(vector) != 384:
        raise ValueError(
            f"Expected 384-dimensional vector, got {len(vector)}"
        )

    params = {
        "id": vector_id,
        "text": text,
        "source": source,
        "page": page,
        "chunk": chunk,
    }

    vector_body = ",".join(map(str, vector))

    response = httpx.post(
        f"{VECTOR_ENGINE_URL}/insert",
        params=params,
        content=vector_body,
        headers={
            "Content-Type": "text/plain"
        },
        timeout=30.0,
    )

    return response


if __name__ == "__main__":

    text = "Vector client test using semantic embeddings."

    vector = generate_embedding(text)

    print("Embedding dimensions:", len(vector))

    response = insert_vector(
        vector_id=999,
        vector=vector,
        text=text,
        source="test.txt",
        page=1,
        chunk=1,
    )

    print("Status:", response.status_code)
    print("Response:", response.text)