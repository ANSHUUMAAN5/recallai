from ingestion.embedding import generate_embedding
from ingestion.search_client import search_vectors
from rag.llm_client import generate_answer


def build_context(
    results: list[dict],
) -> str:
    """
    Convert retrieved vector search results
    into context for the LLM.
    """

    context_parts = []

    for result in results:

        context_parts.append(
            f"""
Source: {result['source']}
Page: {result['page']}
Chunk: {result['chunk']}

{result['text']}
""".strip()
        )

    return "\n\n---\n\n".join(
        context_parts
    )


def answer_question(
    question: str,
    k: int = 3,
) -> dict:
    """
    Full RAG pipeline:

        question
            ↓
        embedding
            ↓
        vector search
            ↓
        context
            ↓
        Ollama
            ↓
        answer
    """

    # -------------------------------------------------
    # 1. Convert question to embedding
    # -------------------------------------------------

    query_vector = generate_embedding(
        question
    )

    # -------------------------------------------------
    # 2. Retrieve relevant chunks
    # -------------------------------------------------

    search_result = search_vectors(
        query_vector,
        k=k,
        algorithm="hnsw",
        metric="cosine",
    )

    results = search_result["results"]

    # -------------------------------------------------
    # 3. Nothing indexed at all — fall back to a plain,
    # clearly-labeled general-knowledge answer instead of
    # a flat refusal. (Documents exist but are irrelevant
    # to the question is a separate, fuzzier case — left
    # as a strict "not found" for now.)
    # -------------------------------------------------

    if not results:

        prompt = f"""
Answer the user's question using your own general knowledge.

USER QUESTION:

{question}

ANSWER:
""".strip()

        answer = generate_answer(
            prompt
        )

        return {
            "question": question,
            "answer": answer,
            "sources": [],
            "grounded": False,
        }

    # -------------------------------------------------
    # 4. Build context
    # -------------------------------------------------

    context = build_context(
        results
    )

    # -------------------------------------------------
    # 5. Build grounded prompt
    # -------------------------------------------------

    prompt = f"""
You are RecallAI, a document question-answering assistant.

Answer the user's question using ONLY the provided document context.

IMPORTANT — name matching rule: if the question asks about someone by
a fuller name (e.g. "Anshuman Mathur") and the context describes a
person by a shorter or partial version of that same name (e.g. just
"Anshuman"), these should be treated as the SAME person. Do not refuse
to answer just because the exact full name isn't repeated word-for-
word in the context. Only refuse if the context is about a clearly
different, unrelated topic or person.

Example: if the context says "Anshuman is a student who likes AI" and
the question is "who is Anshuman Mathur?", answer using that context
— do not say the information wasn't found.

If, after applying that rule, the answer still cannot be found in the
context, say exactly:
"I could not find this information in the uploaded documents."

Do not invent facts beyond reasonable inference from the context above.
Do not use outside knowledge beyond that reasonable inference.

DOCUMENT CONTEXT:

{context}

USER QUESTION:

{question}

ANSWER:
""".strip()

    # -------------------------------------------------
    # 6. Generate answer with Ollama
    # -------------------------------------------------

    answer = generate_answer(
        prompt
    )

    # -------------------------------------------------
    # 7. Return answer + sources
    # -------------------------------------------------

    sources = []

    for result in results:

        sources.append({
            "id": result["id"],
            "source": result["source"],
            "page": result["page"],
            "chunk": result["chunk"],
        })

    return {
        "question": question,
        "answer": answer,
        "sources": sources,
        "grounded": True,
    }