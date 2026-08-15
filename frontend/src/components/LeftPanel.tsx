"use client";

import { ALGORITHMS, METRICS, type Algorithm, type Metric } from "@/lib/constants";

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  algorithm: Algorithm;
  onAlgorithmChange: (value: Algorithm) => void;
  metric: Metric;
  onMetricChange: (value: Metric) => void;
  k: number;
  onKChange: (value: number) => void;
  onRun: () => void;
  loading: boolean;
}

export default function LeftPanel({
  query,
  onQueryChange,
  algorithm,
  onAlgorithmChange,
  metric,
  onMetricChange,
  k,
  onKChange,
  onRun,
  loading,
}: Props) {
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onRun();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-neutral-800 bg-neutral-950 px-4 py-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
          Query
        </label>
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search or ask something..."
          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running..." : "Run"}
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Algorithm
        </p>
        <div className="grid grid-cols-1 gap-1">
          {ALGORITHMS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onAlgorithmChange(a)}
              className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                algorithm === a
                  ? "bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/40"
                  : "text-neutral-400 hover:bg-neutral-900"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
          Distance metric
        </label>
        <select
          value={metric}
          onChange={(event) => onMetricChange(event.target.value as Metric)}
          className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100 focus:border-neutral-600 focus:outline-none"
        >
          {METRICS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Top-K
          </label>
          <span className="text-xs text-neutral-400">{k}</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={k}
          onChange={(event) => onKChange(Number(event.target.value))}
          className="w-full accent-cyan-400"
        />
      </div>

      <div className="mt-auto space-y-2 border-t border-neutral-800 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Legend
        </p>
        <div className="space-y-1.5 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pink-400" />
            Query
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Real nearest neighbors
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-neutral-600" />
            Corpus
          </div>
        </div>
      </div>
    </aside>
  );
}
