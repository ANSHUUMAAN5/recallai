import sys

from ingestion.pipeline import ingest_document


def main():
    """
    Command-line entry point for document ingestion.

    Usage:

        python -m ingestion.ingest <file_path>

    Example:

        python -m ingestion.ingest \
            examples/Journey_Through_Hindu_Wisdom.pdf
    """

    # -------------------------------------------------
    # Validate command-line arguments
    # -------------------------------------------------

    if len(sys.argv) != 2:

        print(
            "Usage: "
            "python -m ingestion.ingest <file_path>"
        )

        sys.exit(1)

    file_path = sys.argv[1]

    print(
        f"Processing: {file_path}"
    )

    # -------------------------------------------------
    # Run ingestion pipeline
    # -------------------------------------------------

    results = ingest_document(
        file_path=file_path
    )

    # -------------------------------------------------
    # Print results
    # -------------------------------------------------

    print(
        f"Inserted {len(results)} chunks."
    )

    for result in results:

        print(
            f"ID={result['id']} "
            f"Page={result['page']} "
            f"Chunk={result['chunk']}"
        )


if __name__ == "__main__":
    main()