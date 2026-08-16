import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()


VECTOR_ENGINE_URL = os.environ.get(
    "VECTOR_ENGINE_URL",
    "http://localhost:8081",
)

if not VECTOR_ENGINE_URL.startswith("http"):
    VECTOR_ENGINE_URL = f"http://{VECTOR_ENGINE_URL}"


# =============================================================
# Retrying request helper
#
# Render's free tier spins the vector engine down after ~15 min
# idle; waking it back up can take 30-60s and shows up as
# connection errors or 502/503/504 responses in the meantime —
# not something a single short-timeout request can ride out. Retry
# with backoff instead of failing on the first attempt.
# =============================================================

_RETRYABLE_STATUS_CODES = {502, 503, 504}
_ATTEMPTS = 5
_REQUEST_TIMEOUT = 15
_BACKOFF_SECONDS = 5


def _request_with_retry(method: str, url: str, **kwargs) -> requests.Response:

    last_error: Exception | None = None

    for attempt in range(_ATTEMPTS):

        try:

            response = requests.request(
                method,
                url,
                timeout=_REQUEST_TIMEOUT,
                **kwargs,
            )

            if response.status_code in _RETRYABLE_STATUS_CODES:

                last_error = requests.exceptions.HTTPError(
                    f"{response.status_code} from vector engine",
                    response=response,
                )

            else:

                response.raise_for_status()

                return response

        except requests.exceptions.RequestException as error:

            last_error = error

        if attempt < _ATTEMPTS - 1:

            time.sleep(_BACKOFF_SECONDS)

    raise last_error


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

    response = _request_with_retry(
        "POST",
        f"{VECTOR_ENGINE_URL}/documents",
        params={
            "filename": filename,
        },
    )

    data = response.json()

    return data["document"]


def delete_document(document_id: int) -> None:
    """
    Delete a DocumentRecord (and its chunks) from the C++ Vector
    Engine. Best-effort — used for cleanup, so failures here aren't
    fatal to the caller.
    """

    try:

        _request_with_retry(
            "DELETE",
            f"{VECTOR_ENGINE_URL}/documents/{document_id}",
        )

    except requests.exceptions.RequestException:

        pass


def get_next_id() -> int:
    """
    Ask the C++ Vector Engine for the next vector ID.
    """

    response = _request_with_retry(
        "GET",
        f"{VECTOR_ENGINE_URL}/next-id",
    )

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

    response = _request_with_retry(
        "POST",
        f"{VECTOR_ENGINE_URL}/insert",
        params=params,
        data=vector_body,
        headers={
            "Content-Type": "text/plain",
        },
    )

    return response.json()