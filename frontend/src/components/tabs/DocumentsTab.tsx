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

  const [showPaste, setShowPaste] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");

  async function submitFile(file: File) {
    setUploading(true);
    setError(null);

    const slowTimer = setTimeout(() => setSlow(true), 6000);

    try {
      const result = await onUpload(file);
      if (result && result.error) {
        setError(result.error);
        return false;
      }
      return true;
    } catch {
      setError("Upload failed.");
      return false;
    } finally {
      clearTimeout(slowTimer);
      setUploading(false);
      setSlow(false);
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    await submitFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePasteSubmit(event: React.FormEvent) {
    event.preventDefault();

    const text = pasteText.trim();
    if (!text) return;

    let filename = pasteTitle.trim() || "pasted-note";
    if (!filename.toLowerCase().endsWith(".txt")) filename += ".txt";

    const file = new File([text], filename, { type: "text/plain" });

    const ok = await submitFile(file);
    if (ok) {
      setPasteTitle("");
      setPasteText("");
      setShowPaste(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer rounded-md bg-cyan-400 px-4 py-2 text-center text-sm font-medium text-neutral-950 hover:bg-cyan-300">
          {uploading ? "Uploading..." : "Upload file"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            disabled={uploading}
            onChange={handleFileSelected}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowPaste((v) => !v)}
          disabled={uploading}
          className="flex-1 rounded-md border border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Paste text
        </button>
      </div>

      {showPaste && (
        <form
          onSubmit={handlePasteSubmit}
          className="space-y-2 rounded-md border border-neutral-800 bg-neutral-900/50 p-3"
        >
          <input
            type="text"
            value={pasteTitle}
            onChange={(event) => setPasteTitle(event.target.value)}
            placeholder="Title (e.g. meeting-notes)"
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
          />
          <textarea
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            placeholder="Paste or type any text — notes, an article, anything you want searchable..."
            rows={6}
            className="w-full resize-y rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={uploading || !pasteText.trim()}
            className="w-full rounded-md bg-cyan-400 px-4 py-1.5 text-sm font-medium text-neutral-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Adding..." : "Add to library"}
          </button>
        </form>
      )}

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
