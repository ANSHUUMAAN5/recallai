"use client";

import Link from "next/link";
import { useSystemStatus } from "@/lib/useSystemStatus";

interface Props {
  vectorCount: number | null;
}

export default function TopBar({ vectorCount }: Props) {
  const { config } = useSystemStatus();

  return (
    <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-xs text-neutral-500 transition-colors hover:text-cyan-400"
        >
          ← Home
        </Link>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-sm font-semibold tracking-widest text-neutral-100">
            RECALLAI
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-500">
          {vectorCount === null ? "..." : vectorCount} vectors · 3D PCA
        </span>

        <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          {config
            ? `${config.llm_provider === "ollama" ? "Local AI" : config.llm_provider} · ${config.llm_model}`
            : "..."}
        </div>
      </div>
    </div>
  );
}
