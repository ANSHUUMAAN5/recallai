"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Layers } from "lucide-react";
import { getStats, listDocuments, type DocumentSummary } from "@/lib/api";

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
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">{label}</p>
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <p className="mt-3 text-3xl font-semibold text-cyan-400">{value}</p>
    </div>
  );
}

export default function OverviewPage() {
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [vectorCount, setVectorCount] = useState<number | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<DocumentSummary[]>([]);

  useEffect(() => {
    getStats()
      .then((stats) => setVectorCount(stats.count))
      .catch(() => setVectorCount(null));

    listDocuments()
      .then((res) => {
        setDocumentCount(res.documents.length);
        setRecentDocuments(res.documents.slice(-5).reverse());
      })
      .catch(() => {
        setDocumentCount(null);
        setRecentDocuments([]);
      });
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-neutral-400">
          System status and index overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Recent documents
        </h2>

        {recentDocuments.length === 0 ? (
          <p className="text-neutral-500">
            No documents yet.{" "}
            <Link href="/documents" className="text-cyan-400 hover:underline">
              Upload one
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-800">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 text-sm last:border-b-0"
              >
                <span>{doc.filename}</span>
                <span className="text-neutral-500">{doc.chunks} chunks</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
