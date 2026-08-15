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

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get(
    "GEMINI_MODEL",
    "gemini-2.5-flash-lite",
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


def _generate_with_gemini(prompt: str) -> str:
    """
    Send a prompt to the Gemini API.
    """

    response = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent",
        params={"key": GEMINI_API_KEY},
        json={
            "contents": [
                {"parts": [{"text": prompt}]},
            ],
        },
        timeout=120,
    )

    response.raise_for_status()

    data = response.json()

    return data["candidates"][0]["content"]["parts"][0]["text"]


def generate_answer(prompt: str) -> str:
    """
    Generate an answer using the configured LLM provider.

    Provider is selected via the LLM_PROVIDER env var:
      - "ollama" (default): local model via Ollama
      - "claude": hosted Claude API
      - "gemini": hosted Gemini API
    """

    provider = os.environ.get(
        "LLM_PROVIDER",
        "ollama",
    ).lower()

    if provider == "ollama":
        return _generate_with_ollama(prompt)

    if provider == "claude":
        return _generate_with_claude(prompt)

    if provider == "gemini":
        return _generate_with_gemini(prompt)

    raise ValueError(
        f"Unknown LLM_PROVIDER: {provider!r}. "
        "Use 'ollama', 'claude', or 'gemini'."
    )
