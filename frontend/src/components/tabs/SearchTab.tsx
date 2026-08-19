"use client";

import type { SearchResult } from "@/lib/api";

interface Props {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  durationMs: number | null;
}

export default function SearchTab({ results, loading, error, durationMs }: Props) {
  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-muted">
        Raw vector search results — set the query, algorithm, metric, and
        top-k on the left, then hit Run.
      </p>

      {durationMs !== null && !loading && (
        <p className="text-xs text-muted">
          {results.length} results in {durationMs.toFixed(1)}ms
        </p>
      )}

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-muted">Searching...</p>}

      {!loading && results.length === 0 && !error && (
        <p className="text-sm text-muted">
          No results yet. Run a query from the left panel.
        </p>
      )}

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.id}
            className="rounded-lg border border-border bg-surface-2 p-3"
          >
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="truncate">
                {result.source} — p{result.page}, c{result.chunk}
              </span>
              <span className="shrink-0 font-mono text-accent">
                {result.distance.toFixed(4)}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
              {result.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
