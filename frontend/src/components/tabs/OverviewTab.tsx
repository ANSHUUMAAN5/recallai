"use client";

import { FileText, Layers } from "lucide-react";
import type { DocumentSummary } from "@/lib/api";

function Tile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">{label}</p>
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-cyan-400">{value}</p>
    </div>
  );
}

interface Props {
  documentCount: number | null;
  vectorCount: number | null;
  documents: DocumentSummary[];
}

export default function OverviewTab({ documentCount, vectorCount, documents }: Props) {
  const recent = documents.slice(-5).reverse();

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="Documents"
          value={documentCount === null ? "—" : documentCount.toString()}
          icon={FileText}
        />
        <Tile
          label="Vectors"
          value={vectorCount === null ? "—" : vectorCount.toString()}
          icon={Layers}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Recent documents
        </p>

        {recent.length === 0 ? (
          <p className="text-sm text-neutral-500">No documents yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-800">
            {recent.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border-b border-neutral-800 px-3 py-2 text-sm last:border-b-0"
              >
                <span className="truncate">{doc.filename}</span>
                <span className="shrink-0 text-neutral-500">{doc.chunks} chunks</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
