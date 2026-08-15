"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listDocuments,
  deleteDocument,
  uploadDocument,
  type DocumentSummary,
} from "@/lib/api";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listDocuments();
      setDocuments(res.documents);
      setError(null);
    } catch {
      setError("Could not reach the API. Is it running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadDocument(file);

      if (result.error) {
        setError(result.error);
      } else {
        await refresh();
      }
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteDocument(id);
      await refresh();
    } catch {
      setError("Delete failed.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="mt-1 text-neutral-400">
            Upload PDF or TXT files to index for search and Q&amp;A.
          </p>
        </div>

        <label className="cursor-pointer rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white">
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
      </div>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900/50 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Filename</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">Chunks</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-6 text-neutral-500" colSpan={4}>
                  Loading...
                </td>
              </tr>
            )}

            {!loading && documents.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-neutral-500" colSpan={4}>
                  No documents uploaded yet.
                </td>
              </tr>
            )}

            {documents.map((doc) => (
              <tr key={doc.id} className="border-t border-neutral-800">
                <td className="px-4 py-3">{doc.filename}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {doc.upload_time}
                </td>
                <td className="px-4 py-3 text-neutral-400">{doc.chunks}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
