"use client";

import { useSystemStatus, type ServiceState } from "@/lib/useSystemStatus";

function Dot({ state }: { state: ServiceState }) {
  const color =
    state === "up"
      ? "bg-emerald-500"
      : state === "down"
        ? "bg-red-500"
        : "bg-neutral-600";

  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

export default function StatusBar() {
  const { apiState, engineState, config } = useSystemStatus();

  return (
    <div className="flex items-center gap-6 border-t border-neutral-800 px-6 py-2 text-xs text-neutral-500">
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
        <span className="ml-auto text-neutral-600">{config.llm_model}</span>
      )}
    </div>
  );
}
