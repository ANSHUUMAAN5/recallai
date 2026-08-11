from ingestion.document_loader import load_text_file
from ingestion.chunker import chunk_text
from ingestion.embedding import generate_embedding
from ingestion.vector_client import insert_vector


def ingest_document(
    file_path: str,
    source: str | None = None,
    page: int = 1,
    starting_id: int = 1000,
):
    """
    Load a text document, split it into chunks, generate
    embeddings, and store each chunk in the C++ Vector Engine.
    """

    # 1. Load document
    text = load_text_file(file_path)

    # 2. Split document into chunks
    chunks = chunk_text(
        text,
        chunk_size=500,
        overlap=50,
    )

    if not chunks:
        raise ValueError("Document contains no usable text.")

    # Use filename as the default source
    if source is None:
        source = file_path

    inserted = []

    # 3. Process each chunk
    for index, chunk in enumerate(chunks):

        # 4. Generate 384-D embedding
        embedding = generate_embedding(chunk)

        # 5. Generate unique vector ID
        vector_id = starting_id + index

        # 6. Store in C++ Vector Engine
        response = insert_vector(
            vector_id=vector_id,
            vector=embedding,
            text=chunk,
            source=source,
            page=page,
            chunk=index + 1,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to insert chunk {index + 1}: "
                f"{response.status_code} {response.text}"
            )

        inserted.append({
            "id": vector_id,
            "chunk": index + 1,
            "text": chunk,
        })

    return inserted


if __name__ == "__main__":

    results = ingest_document(
        "examples/demo.txt",
        source="demo.txt",
        starting_id=1000,
    )

    print(f"Inserted {len(results)} chunks.")

    for result in results:
        print(
            f"ID={result['id']} "
            f"Chunk={result['chunk']}"
        )