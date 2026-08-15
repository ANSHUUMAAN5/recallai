import os

import requests
from dotenv import load_dotenv

load_dotenv()


VECTOR_ENGINE_URL = os.environ.get(
    "VECTOR_ENGINE_URL",
    "http://localhost:8081",
)

if not VECTOR_ENGINE_URL.startswith("http"):
    VECTOR_ENGINE_URL = f"http://{VECTOR_ENGINE_URL}"


def create_document(filename: str) -> dict:
    """
    Create a DocumentRecord in the C++ Vector Engine.

    Returns:
        {
            "id": 1,
            "filename": "...",
            "upload_time": "...",
            "chunks": 0
        }
    """

    response = requests.post(
        f"{VECTOR_ENGINE_URL}/documents",
        params={
            "filename": filename,
        },
        timeout=10,
    )

    response.raise_for_status()

    data = response.json()

    return data["document"]


def get_next_id() -> int:
    """
    Ask the C++ Vector Engine for the next vector ID.
    """

    response = requests.get(
        f"{VECTOR_ENGINE_URL}/next-id",
        timeout=5,
    )

    response.raise_for_status()

    data = response.json()

    return int(data["next_id"])


def insert_vector(
    vector_id: int,
    document_id: int,
    vector: list[float],
    text: str,
    source: str,
    page: int,
    chunk: int,
):
    """
    Insert one embedded chunk into the C++ Vector Engine.
    """

    params = {
        "id": vector_id,
        "document_id": document_id,
        "text": text,
        "source": source,
        "page": page,
        "chunk": chunk,
    }

    vector_body = ",".join(
        str(value)
        for value in vector
    )

    response = requests.post(
        f"{VECTOR_ENGINE_URL}/insert",
        params=params,
        data=vector_body,
        headers={
            "Content-Type": "text/plain",
        },
        timeout=10,
    )

    response.raise_for_status()

    return response.json()