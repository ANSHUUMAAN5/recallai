"use client";

import type { Config } from "@/lib/api";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 py-2 text-sm last:border-b-0">
      <span className="text-neutral-400">{label}</span>
      <span className="font-mono text-neutral-200">{value}</span>
    </div>
  );
}

interface Props {
  config: Config | null;
  vectorCount: number | null;
}

export default function SettingsTab({ config, vectorCount }: Props) {
  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-neutral-400">Runtime configuration.</p>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3">
        <InfoRow label="LLM provider" value={config?.llm_provider ?? "..."} />
        <InfoRow label="LLM model" value={config?.llm_model ?? "..."} />
        <InfoRow
          label="Vector count"
          value={vectorCount === null ? "..." : vectorCount.toString()}
        />
      </div>

      <p className="text-xs text-neutral-500">
        Algorithm, distance metric, and top-k are set directly from the left
        panel — they apply immediately, there's nothing to save here.
      </p>
    </div>
  );
}
