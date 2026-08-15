"use client";

import { useState } from "react";
import { ask, type Source } from "@/lib/api";

interface Turn {
  question: string;
  answer: string;
  sources: Source[];
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    const slowTimer = setTimeout(() => setSlow(true), 6000);

    try {
      const result = await ask(trimmed);
      setTurns((prev) => [
        ...prev,
        { question: trimmed, answer: result.answer, sources: result.sources },
      ]);
      setQuestion("");
    } catch {
      setError(
        "Could not get an answer. Check that the API and LLM provider are running."
      );
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlow(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Ask AI</h1>
        <p className="mt-1 text-neutral-400">
          Ask questions grounded in your uploaded documents.
        </p>
      </div>

      <div className="space-y-6">
        {turns.length === 0 && (
          <p className="text-neutral-500">
            No questions asked yet. Upload a document, then ask something
            about it below.
          </p>
        )}

        {turns.map((turn, index) => (
          <div key={index} className="space-y-2">
            <p className="font-medium text-neutral-100">{turn.question}</p>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
              <p className="whitespace-pre-wrap text-neutral-200">
                {turn.answer}
              </p>

              {turn.sources.length > 0 && (
                <div className="mt-4 border-t border-neutral-800 pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Sources
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-neutral-400">
                    {turn.sources.map((source, sourceIndex) => (
                      <li key={sourceIndex}>
                        {source.source} — page {source.page}, chunk{" "}
                        {source.chunk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <p className="text-neutral-500">
            {slow
              ? "Still working — the backend runs on free-tier hosting and can take up to a minute to wake up after being idle."
              : "Thinking..."}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 pt-4">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about your documents..."
          disabled={loading}
          className="flex-1 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
