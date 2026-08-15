import os

import requests
from dotenv import load_dotenv

load_dotenv()


OLLAMA_URL = os.environ.get(
    "OLLAMA_URL",
    "http://localhost:11434",
)
OLLAMA_MODEL = os.environ.get(
    "OLLAMA_MODEL",
    "qwen2.5:3b",
)

ANTHROPIC_MODEL = os.environ.get(
    "ANTHROPIC_MODEL",
    "claude-sonnet-4-5",
)


def _generate_with_ollama(prompt: str) -> str:
    """
    Send a prompt to a local Ollama LLM.
    """

    response = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        },
        timeout=120,
    )

    response.raise_for_status()

    data = response.json()

    return data["response"]


def _generate_with_claude(prompt: str) -> str:
    """
    Send a prompt to the Claude API.
    """

    import anthropic

    client = anthropic.Anthropic()

    message = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt},
        ],
    )

    return message.content[0].text


def generate_answer(prompt: str) -> str:
    """
    Generate an answer using the configured LLM provider.

    Provider is selected via the LLM_PROVIDER env var:
      - "ollama" (default): local model via Ollama
      - "claude": hosted Claude API
    """

    provider = os.environ.get(
        "LLM_PROVIDER",
        "ollama",
    ).lower()

    if provider == "ollama":
        return _generate_with_ollama(prompt)

    if provider == "claude":
        return _generate_with_claude(prompt)

    raise ValueError(
        f"Unknown LLM_PROVIDER: {provider!r}. "
        "Use 'ollama' or 'claude'."
    )
