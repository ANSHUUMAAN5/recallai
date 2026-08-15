"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { search, type SearchResult } from "@/lib/api";

const ALGORITHMS = ["hnsw", "kdtree", "bruteforce"] as const;
const METRICS = ["cosine", "euclidean", "manhattan"] as const;

export default function SearchPageClient() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [algorithm, setAlgorithm] = useState<(typeof ALGORITHMS)[number]>("hnsw");
  const [metric, setMetric] = useState<(typeof METRICS)[number]>("cosine");
  const [k, setK] = useState(5);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  useEffect(() => {
    const preferred = window.localStorage.getItem("recallai-default-algorithm");
    const preferredMetric = window.localStorage.getItem("recallai-default-metric");

    if (preferred && (ALGORITHMS as readonly string[]).includes(preferred)) {
      setAlgorithm(preferred as (typeof ALGORITHMS)[number]);
    }
    if (preferredMetric && (METRICS as readonly string[]).includes(preferredMetric)) {
      setMetric(preferredMetric as (typeof METRICS)[number]);
    }
  }, []);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    const started = performance.now();

    try {
      const response = await search(trimmed, k, algorithm, metric);
      setResults(response.results);
      setDurationMs(performance.now() - started);
    } catch {
      setError("Search failed. Is the vector engine running?");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = searchParams.get("q");
    if (initial) {
      runSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    runSearch(query);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="mt-1 text-neutral-400">
          Raw vector search — pick the algorithm and distance metric directly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your documents..."
          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            Algorithm
            <select
              value={algorithm}
              onChange={(event) =>
                setAlgorithm(event.target.value as (typeof ALGORITHMS)[number])
              }
              className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-neutral-100 focus:border-neutral-600 focus:outline-none"
            >
              {ALGORITHMS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-neutral-400">
            Metric
            <select
              value={metric}
              onChange={(event) =>
                setMetric(event.target.value as (typeof METRICS)[number])
              }
              className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-neutral-100 focus:border-neutral-600 focus:outline-none"
            >
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-neutral-400">
            k
            <input
              type="number"
              min={1}
              max={20}
              value={k}
              onChange={(event) => setK(Number(event.target.value) || 5)}
              className="w-16 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-neutral-100 focus:border-neutral-600 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-md bg-cyan-400 px-4 py-1.5 text-sm font-medium text-neutral-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>

          {durationMs !== null && !loading && (
            <span className="text-xs text-neutral-500">
              {results.length} results in {durationMs.toFixed(1)}ms
            </span>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="text-neutral-500">Searching...</p>}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.id}
              className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
            >
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>
                  {result.source} — page {result.page}, chunk {result.chunk}
                </span>
                <span className="font-mono text-cyan-400">
                  distance {result.distance.toFixed(4)}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-neutral-300">
                {result.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && durationMs !== null && (
        <p className="text-neutral-500">No results.</p>
      )}
    </div>
  );
}
