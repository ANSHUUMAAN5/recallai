import os

import requests
from dotenv import load_dotenv

load_dotenv()


VECTOR_ENGINE_URL = os.environ.get(
    "VECTOR_ENGINE_URL",
    "http://localhost:8081",
)


def search_vectors(
    query_vector: list[float],
    k: int = 5,
    algorithm: str = "hnsw",
    metric: str = "cosine",
):
    """
    Search the C++ Vector Engine using a query embedding.
    """

    vector_body = ",".join(
        str(value)
        for value in query_vector
    )

    params = {
        "k": k,
        "algorithm": algorithm,
        "metric": metric,
    }

    response = requests.post(
        f"{VECTOR_ENGINE_URL}/search",
        params=params,
        data=vector_body,
        headers={
            "Content-Type": "text/plain",
        },
        timeout=10,
    )

    response.raise_for_status()

    return response.json()