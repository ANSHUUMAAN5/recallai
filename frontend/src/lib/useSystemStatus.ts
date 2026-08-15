"use client";

import { useEffect, useState } from "react";
import { getHealth, getVectorEngineHealth, getConfig, type Config } from "@/lib/api";

export type ServiceState = "checking" | "up" | "down";

export interface SystemStatus {
  apiState: ServiceState;
  engineState: ServiceState;
  config: Config | null;
}

const POLL_INTERVAL_MS = 30_000;

export function useSystemStatus(): SystemStatus {
  const [apiState, setApiState] = useState<ServiceState>("checking");
  const [engineState, setEngineState] = useState<ServiceState>("checking");
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    let cancelled = false;

    function poll() {
      getHealth()
        .then(() => !cancelled && setApiState("up"))
        .catch(() => !cancelled && setApiState("down"));

      getVectorEngineHealth()
        .then(() => !cancelled && setEngineState("up"))
        .catch(() => !cancelled && setEngineState("down"));

      getConfig()
        .then((c) => !cancelled && setConfig(c))
        .catch(() => !cancelled && setConfig(null));
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { apiState, engineState, config };
}
