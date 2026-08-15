"use client";

import { useEffect, useState } from "react";
import { getConfig, getStats, type Config } from "@/lib/api";

const ALGORITHMS = ["hnsw", "kdtree", "bruteforce"] as const;
const METRICS = ["cosine", "euclidean", "manhattan"] as const;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 py-3 last:border-b-0">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className="font-mono text-sm text-neutral-200">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [vectorCount, setVectorCount] = useState<number | null>(null);
  const [defaultAlgorithm, setDefaultAlgorithm] = useState<
    (typeof ALGORITHMS)[number]
  >("hnsw");
  const [defaultMetric, setDefaultMetric] = useState<
    (typeof METRICS)[number]
  >("cosine");

  useEffect(() => {
    getConfig().then(setConfig).catch(() => setConfig(null));
    getStats()
      .then((s) => setVectorCount(s.count))
      .catch(() => setVectorCount(null));

    const savedAlgorithm = window.localStorage.getItem(
      "recallai-default-algorithm"
    );
    const savedMetric = window.localStorage.getItem("recallai-default-metric");

    if (savedAlgorithm && (ALGORITHMS as readonly string[]).includes(savedAlgorithm)) {
      setDefaultAlgorithm(savedAlgorithm as (typeof ALGORITHMS)[number]);
    }
    if (savedMetric && (METRICS as readonly string[]).includes(savedMetric)) {
      setDefaultMetric(savedMetric as (typeof METRICS)[number]);
    }
  }, []);

  function handleAlgorithmChange(value: (typeof ALGORITHMS)[number]) {
    setDefaultAlgorithm(value);
    window.localStorage.setItem("recallai-default-algorithm", value);
  }

  function handleMetricChange(value: (typeof METRICS)[number]) {
    setDefaultMetric(value);
    window.localStorage.setItem("recallai-default-metric", value);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-neutral-400">
          Runtime configuration and search preferences.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          System
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4">
          <InfoRow label="LLM provider" value={config?.llm_provider ?? "..."} />
          <InfoRow label="LLM model" value={config?.llm_model ?? "..."} />
          <InfoRow
            label="Vector count"
            value={vectorCount === null ? "..." : vectorCount.toString()}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Search defaults
        </h2>
        <p className="mb-3 text-sm text-neutral-500">
          Applied automatically the next time you open the Search page.
        </p>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 space-y-4">
          <label className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">Algorithm</span>
            <select
              value={defaultAlgorithm}
              onChange={(event) =>
                handleAlgorithmChange(
                  event.target.value as (typeof ALGORITHMS)[number]
                )
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

          <label className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">Metric</span>
            <select
              value={defaultMetric}
              onChange={(event) =>
                handleMetricChange(
                  event.target.value as (typeof METRICS)[number]
                )
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
        </div>
      </div>
    </div>
  );
}
