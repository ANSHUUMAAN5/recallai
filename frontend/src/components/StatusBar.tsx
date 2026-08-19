"use client";

import { useSystemStatus, type ServiceState } from "@/lib/useSystemStatus";

function Dot({ state }: { state: ServiceState }) {
  const color =
    state === "up"
      ? "bg-emerald-500"
      : state === "down"
        ? "bg-red-500"
        : "bg-faint";

  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

export default function StatusBar() {
  const { apiState, engineState, config } = useSystemStatus();

  return (
    <div data-ws-status className="flex items-center gap-6 border-t border-border bg-surface px-6 py-2 text-xs text-muted">
      <span className="flex items-center gap-2">
        <Dot state={apiState} />
        API {apiState === "up" ? "Online" : apiState === "down" ? "Offline" : "..."}
      </span>
      <span className="flex items-center gap-2">
        <Dot state={engineState} />
        Vector Engine {engineState === "up" ? "Online" : engineState === "down" ? "Offline" : "..."}
      </span>
      <span className="flex items-center gap-2">
        <Dot state={config ? "up" : "checking"} />
        {config
          ? `${config.llm_provider === "ollama" ? "Ollama" : config.llm_provider}`
          : "LLM"}
      </span>
      {config && (
        <span className="ml-auto text-faint">{config.llm_model}</span>
      )}
    </div>
  );
}
