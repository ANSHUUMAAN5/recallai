from ingestion.chunker import chunk_text


def chunk_pdf_pages(
    pages: list[dict],
    chunk_size: int = 500,
    overlap: int = 50,
) -> list[dict]:
    """
    Split PDF pages into chunks while preserving page metadata.

    Each returned chunk contains:
        - page
        - chunk
        - text
    """

    chunks = []

    for page_data in pages:

        page_number = page_data["page"]
        text = page_data["text"]

        page_chunks = chunk_text(
            text,
            chunk_size=chunk_size,
            overlap=overlap,
        )

        for chunk_number, chunk in enumerate(
            page_chunks,
            start=1,
        ):
            chunks.append({
                "page": page_number,
                "chunk": chunk_number,
                "text": chunk,
            })

    return chunks