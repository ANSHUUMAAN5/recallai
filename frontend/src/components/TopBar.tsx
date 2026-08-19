"use client";

import Link from "next/link";
import { useSystemStatus } from "@/lib/useSystemStatus";

interface Props {
  vectorCount: number | null;
}

export default function TopBar({ vectorCount }: Props) {
  const { config } = useSystemStatus();

  return (
    <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-xs text-muted transition-colors hover:text-accent"
        >
          ← Home
        </Link>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-sm font-semibold tracking-widest text-ink">
            RECALLAI
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-muted">
          {vectorCount === null ? "..." : vectorCount} vectors · 3D PCA
        </span>

        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {config
            ? `${config.llm_provider === "ollama" ? "Local AI" : config.llm_provider} · ${config.llm_model}`
            : "..."}
        </div>
      </div>
    </div>
  );
}
