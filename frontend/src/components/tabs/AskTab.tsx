"use client";

import { useState } from "react";
import type { Source } from "@/lib/api";

export interface Turn {
  question: string;
  answer: string;
  sources: Source[];
  grounded: boolean;
}

interface Props {
  turns: Turn[];
  loading: boolean;
  onAsk: (question: string) => Promise<void>;
}

export default function AskTab({ turns, loading, onAsk }: Props) {
  const [question, setQuestion] = useState("");
  const [slow, setSlow] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const slowTimer = setTimeout(() => setSlow(true), 6000);

    try {
      await onAsk(trimmed);
      setQuestion("");
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {turns.length === 0 && (
          <p className="text-sm text-muted">
            No questions asked yet. Upload a document, then ask something
            about it.
          </p>
        )}

        {turns.map((turn, index) => (
          <div key={index} className="space-y-2">
            <p className="text-sm font-medium text-ink">
              {turn.question}
            </p>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              {!turn.grounded && (
                <p className="mb-2 inline-block rounded-full border border-warn/30 bg-warn-soft px-2 py-0.5 text-xs text-warn">
                  Not from your documents — general knowledge
                </p>
              )}
              <p className="whitespace-pre-wrap text-sm text-ink-soft">
                {turn.answer}
              </p>

              {turn.sources.length > 0 && (
                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Sources
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-muted">
                    {turn.sources.map((source, sourceIndex) => (
                      <li key={sourceIndex}>
                        {source.source} — p{source.page}, c{source.chunk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <p className="text-sm text-muted">
            {slow
              ? "Still working — the backend runs on free-tier hosting and can take up to a minute to wake up after being idle."
              : "Thinking..."}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
          className="flex-1 rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink shadow-sm transition-all hover:scale-[1.02] hover:bg-accent-hover hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
