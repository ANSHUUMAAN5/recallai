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
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-accent">{value}</p>
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
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Recent documents
        </p>

        {recent.length === 0 ? (
          <p className="text-sm text-muted">No documents yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {recent.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border-b border-border px-3 py-2 text-sm last:border-b-0"
              >
                <span className="truncate text-ink">{doc.filename}</span>
                <span className="shrink-0 text-muted">{doc.chunks} chunks</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
