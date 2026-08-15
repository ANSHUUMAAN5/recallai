"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { X } from "lucide-react";
import {
  getVectorProjection,
  search,
  type ProjectionPoint,
} from "@/lib/api";
import VectorLabScene from "./VectorLabScene";

export default function VectorLabPage() {
  const [points, setPoints] = useState<ProjectionPoint[]>([]);
  const [queryCoord, setQueryCoord] = useState<
    { x: number; y: number; z: number } | null
  >(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<ProjectionPoint | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVectorProjection()
      .then((res) => {
        setPoints(res.points);
        setError(null);
      })
      .catch(() => setError("Could not load the embedding space."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const [projection, searchResponse] = await Promise.all([
        getVectorProjection(trimmed),
        search(trimmed, 5, "hnsw", "cosine"),
      ]);

      setPoints(projection.points);
      setQueryCoord(projection.query);
      setHighlightedIds(new Set(searchResponse.results.map((r) => r.id)));
    } catch {
      setError("Query failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-2xl font-semibold">Vector Lab</h1>
        <p className="mt-1 text-neutral-400">
          The embedding space, reduced to 3D via PCA. Drag to rotate, scroll
          to zoom. Pink is your query; cyan points are its real nearest
          neighbors (from HNSW/cosine search, not just visual proximity).
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex max-w-lg gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Query the vector space..."
            className="flex-1 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-md bg-cyan-400 px-4 py-1.5 text-sm font-medium text-neutral-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Plot
          </button>
        </form>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {loading && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
            Loading embedding space...
          </div>
        )}

        {points.length === 0 && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500">
            No vectors indexed yet. Upload a document first.
          </div>
        )}

        {points.length > 0 && (
          <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
            <VectorLabScene
              points={points}
              queryCoord={queryCoord}
              highlightedIds={highlightedIds}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          </Canvas>
        )}

        {selected && (
          <div className="absolute right-4 top-4 w-80 rounded-lg border border-neutral-800 bg-neutral-950/95 p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {selected.source} — page {selected.page}, chunk {selected.chunk}
              </p>
              <button
                onClick={() => setSelected(null)}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X size={14} />
              </button>
            </div>
            <p className="mt-2 max-h-64 overflow-auto text-sm text-neutral-300">
              {selected.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
