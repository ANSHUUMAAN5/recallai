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
      <p className="text-sm text-neutral-400">
        Raw vector search results — set the query, algorithm, metric, and
        top-k on the left, then hit Run.
      </p>

      {durationMs !== null && !loading && (
        <p className="text-xs text-neutral-500">
          {results.length} results in {durationMs.toFixed(1)}ms
        </p>
      )}

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-neutral-500">Searching...</p>}

      {!loading && results.length === 0 && !error && (
        <p className="text-sm text-neutral-500">
          No results yet. Run a query from the left panel.
        </p>
      )}

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3"
          >
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="truncate">
                {result.source} — p{result.page}, c{result.chunk}
              </span>
              <span className="shrink-0 font-mono text-cyan-400">
                {result.distance.toFixed(4)}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-neutral-300">
              {result.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
