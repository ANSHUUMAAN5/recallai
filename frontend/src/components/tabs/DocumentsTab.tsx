"use client";

import { useRef, useState } from "react";
import type { DocumentSummary } from "@/lib/api";

interface Props {
  documents: DocumentSummary[];
  loading: boolean;
  onUpload: (file: File) => Promise<{ error?: string } | void>;
  onDelete: (id: number) => Promise<void>;
}

export default function DocumentsTab({ documents, loading, onUpload, onDelete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const slowTimer = setTimeout(() => setSlow(true), 6000);

    try {
      const result = await onUpload(file);
      if (result && result.error) {
        setError(result.error);
      }
    } catch {
      setError("Upload failed.");
    } finally {
      clearTimeout(slowTimer);
      setUploading(false);
      setSlow(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4 p-4">
      <label className="block cursor-pointer rounded-md bg-cyan-400 px-4 py-2 text-center text-sm font-medium text-neutral-950 hover:bg-cyan-300">
        {uploading ? "Uploading..." : "Upload document"}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          disabled={uploading}
          onChange={handleFileSelected}
        />
      </label>

      {slow && (
        <div className="rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-xs text-neutral-400">
          Still working — the backend runs on free-tier hosting and can
          take up to a minute to wake up after being idle.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        {loading && (
          <p className="px-3 py-4 text-sm text-neutral-500">Loading...</p>
        )}

        {!loading && documents.length === 0 && (
          <p className="px-3 py-4 text-sm text-neutral-500">
            No documents uploaded yet.
          </p>
        )}

        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between border-b border-neutral-800 px-3 py-2 text-sm last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate">{doc.filename}</p>
              <p className="text-xs text-neutral-500">{doc.chunks} chunks</p>
            </div>
            <button
              onClick={() => onDelete(doc.id)}
              className="shrink-0 text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
