"use client";

import { useEffect, useState } from "react";
import {
  getHealth,
  getVectorEngineHealth,
  getStats,
  listDocuments,
} from "@/lib/api";

type ServiceState = "checking" | "up" | "down";

function StatusDot({ state }: { state: ServiceState }) {
  const color =
    state === "up"
      ? "bg-emerald-500"
      : state === "down"
        ? "bg-red-500"
        : "bg-neutral-500";

  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub && <div className="mt-2">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [apiState, setApiState] = useState<ServiceState>("checking");
  const [engineState, setEngineState] = useState<ServiceState>("checking");
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [vectorCount, setVectorCount] = useState<number | null>(null);

  useEffect(() => {
    getHealth()
      .then(() => setApiState("up"))
      .catch(() => setApiState("down"));

    getVectorEngineHealth()
      .then(() => setEngineState("up"))
      .catch(() => setEngineState("down"));

    getStats()
      .then((stats) => setVectorCount(stats.count))
      .catch(() => setVectorCount(null));

    listDocuments()
      .then((res) => setDocumentCount(res.documents.length))
      .catch(() => setDocumentCount(null));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-neutral-400">
          System status and index overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="API"
          value={apiState === "checking" ? "..." : apiState.toUpperCase()}
          sub={<StatusDot state={apiState} />}
        />
        <Tile
          label="Vector Engine"
          value={engineState === "checking" ? "..." : engineState.toUpperCase()}
          sub={<StatusDot state={engineState} />}
        />
        <Tile
          label="Documents"
          value={documentCount === null ? "—" : documentCount.toString()}
        />
        <Tile
          label="Vectors"
          value={vectorCount === null ? "—" : vectorCount.toString()}
        />
      </div>
    </div>
  );
}
