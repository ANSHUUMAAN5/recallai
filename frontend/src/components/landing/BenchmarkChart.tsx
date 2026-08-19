"use client";

import { BENCHMARK, type AlgorithmResult } from "@/lib/benchmarkData";

const COLORS: Record<AlgorithmResult["name"], string> = {
  bruteforce: "var(--color-faint)",
  kdtree: "var(--color-secondary)",
  hnsw: "var(--color-accent)",
};

const LABELS: Record<AlgorithmResult["name"], string> = {
  bruteforce: "Brute-force",
  kdtree: "KD-tree",
  hnsw: "HNSW",
};

const ALGOS: AlgorithmResult["name"][] = ["bruteforce", "kdtree", "hnsw"];

const WIDTH = 640;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 8, bottom: 34, left: 40 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

function GroupedBarChart({
  valueOf,
  formatValue,
  yTicks,
  yScale,
}: {
  valueOf: (a: AlgorithmResult) => number;
  formatValue: (v: number) => string;
  yTicks: number[];
  yScale: (v: number) => number;
}) {
  const groupWidth = PLOT_W / BENCHMARK.results.length;
  const barGap = 4;
  const barWidth = (groupWidth - barGap * (ALGOS.length + 1)) / ALGOS.length;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Bar chart comparing brute-force, KD-tree, and HNSW"
    >
      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {/* Gridlines + y labels */}
        {yTicks.map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={0}
                x2={PLOT_W}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              <text
                x={-8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-faint font-mono"
                fontSize={10}
              >
                {formatValue(tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {BENCHMARK.results.map((sizeResult, groupIndex) => {
          const groupX = groupIndex * groupWidth;

          return (
            <g key={sizeResult.corpus_size}>
              {ALGOS.map((algoName, algoIndex) => {
                const algo = sizeResult.algorithms.find(
                  (a) => a.name === algoName,
                );
                if (!algo) return null;

                const value = valueOf(algo);
                const barX =
                  groupX + barGap + algoIndex * (barWidth + barGap);
                const barY = yScale(value);
                const barHeight = PLOT_H - barY;

                return (
                  <rect
                    key={algoName}
                    data-benchmark-bar
                    x={barX}
                    y={PLOT_H}
                    width={barWidth}
                    height={0}
                    data-target-y={barY}
                    data-target-height={barHeight}
                    fill={COLORS[algoName]}
                    rx={2}
                  />
                );
              })}

              <text
                x={groupX + groupWidth / 2}
                y={PLOT_H + 18}
                textAnchor="middle"
                className="fill-muted font-mono"
                fontSize={10}
              >
                {sizeResult.corpus_size}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={0}
          x2={PLOT_W}
          y1={PLOT_H}
          y2={PLOT_H}
          stroke="var(--color-border-strong)"
          strokeWidth={1}
        />
      </g>
    </svg>
  );
}

export default function BenchmarkChart() {
  const recallScale = (v: number) => PLOT_H - v * PLOT_H;

  // Latency spans ~40us to ~2200us -- log scale, or the small
  // values are invisible next to brute-force at 5000 vectors.
  const maxLatency = Math.max(
    ...BENCHMARK.results.flatMap((r) =>
      r.algorithms.map((a) => a.avg_latency_us),
    ),
  );
  const logMax = Math.log10(maxLatency * 1.15);
  const logMin = Math.log10(20);
  const latencyScale = (v: number) => {
    const t = (Math.log10(Math.max(v, 20)) - logMin) / (logMax - logMin);
    return PLOT_H - t * PLOT_H;
  };

  return (
    <div data-benchmark-charts className="grid gap-10 sm:grid-cols-2">
      <div>
        <p className="mb-1 text-sm font-medium text-ink">
          Recall@{BENCHMARK.k}
        </p>
        <p className="mb-4 text-xs text-muted">
          Share of brute-force&apos;s exact top-{BENCHMARK.k} each algorithm
          actually found
        </p>
        <GroupedBarChart
          valueOf={(a) => a.recall_at_k}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          yTicks={[0, 0.25, 0.5, 0.75, 1]}
          yScale={recallScale}
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-ink">
          Avg. query latency
        </p>
        <p className="mb-4 text-xs text-muted">
          Microseconds per query, log scale — brute-force is O(n), HNSW is
          O(log n)
        </p>
        <GroupedBarChart
          valueOf={(a) => a.avg_latency_us}
          formatValue={(v) => (v >= 1000 ? `${Math.round(v / 1000)}ms` : `${Math.round(v)}µs`)}
          yTicks={[20, 100, 400, 2200]}
          yScale={latencyScale}
        />
      </div>

      <div className="flex items-center gap-6 sm:col-span-2">
        {ALGOS.map((algo) => (
          <div key={algo} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[algo] }}
            />
            <span className="text-xs text-muted">{LABELS[algo]}</span>
          </div>
        ))}
        <span className="ml-auto font-mono text-[11px] text-faint">
          n={BENCHMARK.queries_per_size} queries/size · {BENCHMARK.dimensions}-D
        </span>
      </div>
    </div>
  );
}
