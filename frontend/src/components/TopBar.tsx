"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useSystemStatus } from "@/lib/useSystemStatus";

export default function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { config } = useSystemStatus();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) return;

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="flex items-center gap-4 border-b border-neutral-800 px-6 py-3">
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="relative max-w-md">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-1.5 pl-8 pr-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-400">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        {config
          ? `${config.llm_provider === "ollama" ? "Local AI" : config.llm_provider} · ${config.llm_model}`
          : "..."}
      </div>
    </div>
  );
}
