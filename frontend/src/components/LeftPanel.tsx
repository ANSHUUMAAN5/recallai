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
    <aside
      data-ws-left
      className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface px-4 py-5"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">
          Query
        </label>
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search or ask something..."
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running..." : "Run"}
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
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
                  ? "bg-accent-soft text-accent ring-1 ring-accent/40"
                  : "text-ink-soft hover:bg-surface-2"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">
          Distance metric
        </label>
        <select
          value={metric}
          onChange={(event) => onMetricChange(event.target.value as Metric)}
          className="w-full rounded-md border border-border bg-canvas px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
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
          <label className="text-xs font-medium uppercase tracking-wide text-muted">
            Top-K
          </label>
          <span className="text-xs text-ink-soft">{k}</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={k}
          onChange={(event) => onKChange(Number(event.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div className="mt-auto space-y-2 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Legend
        </p>
        <div className="space-y-1.5 text-xs text-ink-soft">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Query
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Real nearest neighbors
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-faint" />
            Corpus
          </div>
        </div>
      </div>
    </aside>
  );
}
