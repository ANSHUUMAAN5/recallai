"use client";

import type { Config } from "@/lib/api";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-ink-soft">{value}</span>
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
      <p className="text-sm text-muted">Runtime configuration.</p>

      <div className="rounded-lg border border-border bg-surface-2 px-3">
        <InfoRow label="LLM provider" value={config?.llm_provider ?? "..."} />
        <InfoRow label="LLM model" value={config?.llm_model ?? "..."} />
        <InfoRow
          label="Vector count"
          value={vectorCount === null ? "..." : vectorCount.toString()}
        />
      </div>

      <p className="text-xs text-muted">
        Algorithm, distance metric, and top-k are set directly from the left
        panel — they apply immediately, there&apos;s nothing to save here.
      </p>
    </div>
  );
}
