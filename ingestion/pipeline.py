from pathlib import Path

from ingestion.document_loader import load_text_file
from ingestion.pdf_loader import load_pdf
from ingestion.chunker import chunk_text
from ingestion.pdf_chunker import chunk_pdf_pages
from ingestion.embedding import generate_embedding

from ingestion.vector_client import (
    create_document,
    get_next_id,
    insert_vector,
)


def ingest_document(
    file_path: str,
    source: str | None = None,
):
    """
    Ingest a TXT or PDF document into the C++ Vector Engine.

    Pipeline:

        document
            ↓
        create DocumentRecord
            ↓
        text extraction
            ↓
        chunking
            ↓
        384-D embeddings
            ↓
        VectorRecords
            ↓
        C++ VectorDB
            ↓
        persistent vectors.db
    """

    path = Path(file_path)

    # -------------------------------------------------
    # Validate file
    # -------------------------------------------------

    if not path.exists():
        raise FileNotFoundError(
            f"File not found: {file_path}"
        )

    if source is None:
        source = path.name

    all_chunks = []

    # -------------------------------------------------
    # TXT
    # -------------------------------------------------

    if path.suffix.lower() == ".txt":

        text = load_text_file(
            str(path)
        )

        text_chunks = chunk_text(
            text,
            chunk_size=500,
            overlap=50,
        )

        for index, chunk in enumerate(
            text_chunks,
            start=1,
        ):

            all_chunks.append({
                "page": 1,
                "chunk": index,
                "text": chunk,
            })

    # -------------------------------------------------
    # PDF
    # -------------------------------------------------

    elif path.suffix.lower() == ".pdf":

        pages = load_pdf(
            str(path)
        )

        all_chunks = chunk_pdf_pages(
            pages,
            chunk_size=500,
            overlap=50,
        )

    # -------------------------------------------------
    # Unsupported file
    # -------------------------------------------------

    else:

        raise ValueError(
            "Unsupported file type. "
            "Use .txt or .pdf."
        )

    # -------------------------------------------------
    # Validate extracted content
    # -------------------------------------------------

    if not all_chunks:

        raise ValueError(
            "Document contains no usable text."
        )

    # -------------------------------------------------
    # Create Document
    #
    # This happens BEFORE inserting chunks.
    # -------------------------------------------------

    document = create_document(
        filename=source
    )

    document_id = int(
        document["id"]
    )

    # -------------------------------------------------
    # Get first available vector ID
    # -------------------------------------------------

    next_id = get_next_id()

    inserted = []

    # -------------------------------------------------
    # Generate embeddings + insert vectors
    # -------------------------------------------------

    for index, item in enumerate(
        all_chunks
    ):

        embedding = generate_embedding(
            item["text"]
        )

        vector_id = next_id + index

        response = insert_vector(
            vector_id=vector_id,
            document_id=document_id,
            vector=embedding,
            text=item["text"],
            source=source,
            page=item["page"],
            chunk=item["chunk"],
        )

        inserted.append({
            "id": vector_id,
            "document_id": document_id,
            "page": item["page"],
            "chunk": item["chunk"],
            "text": item["text"],
        })

    return inserted