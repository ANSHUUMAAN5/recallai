"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";

import TopBar from "@/components/TopBar";
import LeftPanel from "@/components/LeftPanel";
import RightPanel from "@/components/RightPanel";
import StatusBar from "@/components/StatusBar";
import VectorLabScene from "@/components/VectorLabScene";
import OverviewTab from "@/components/tabs/OverviewTab";
import SearchTab from "@/components/tabs/SearchTab";
import DocumentsTab from "@/components/tabs/DocumentsTab";
import AskTab, { type Turn } from "@/components/tabs/AskTab";
import SettingsTab from "@/components/tabs/SettingsTab";

import { type Algorithm, type Metric, type TabKey } from "@/lib/constants";
import {
  getStats,
  listDocuments,
  deleteDocument,
  uploadDocument,
  search,
  ask,
  getConfig,
  getVectorProjection,
  type DocumentSummary,
  type SearchResult,
  type ProjectionPoint,
  type Config,
} from "@/lib/api";

export default function WorkspacePage() {
  // ---------------------------------------------------------
  // Query controls (left panel)
  // ---------------------------------------------------------
  const [query, setQuery] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("hnsw");
  const [metric, setMetric] = useState<Metric>("cosine");
  const [k, setK] = useState(5);
  const [runLoading, setRunLoading] = useState(false);

  useEffect(() => {
    const savedAlgorithm = window.localStorage.getItem("recallai-algorithm");
    const savedMetric = window.localStorage.getItem("recallai-metric");
    if (savedAlgorithm) setAlgorithm(savedAlgorithm as Algorithm);
    if (savedMetric) setMetric(savedMetric as Metric);
  }, []);

  function handleAlgorithmChange(value: Algorithm) {
    setAlgorithm(value);
    window.localStorage.setItem("recallai-algorithm", value);
  }

  function handleMetricChange(value: Metric) {
    setMetric(value);
    window.localStorage.setItem("recallai-metric", value);
  }

  // ---------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ---------------------------------------------------------
  // Overview / Documents
  // ---------------------------------------------------------
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [vectorCount, setVectorCount] = useState<number | null>(null);
  const [config, setConfig] = useState<Config | null>(null);

  const refreshDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const res = await listDocuments();
      setDocuments(res.documents);
    } catch {
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await getStats();
      setVectorCount(stats.count);
    } catch {
      setVectorCount(null);
    }
  }, []);

  // ---------------------------------------------------------
  // Vector Lab visualization (always mounted, center panel)
  // ---------------------------------------------------------
  const [projectionPoints, setProjectionPoints] = useState<ProjectionPoint[]>([]);
  const [projectionQuery, setProjectionQuery] = useState<
    { x: number; y: number; z: number } | null
  >(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const [selectedPoint, setSelectedPoint] = useState<ProjectionPoint | null>(null);

  const refreshProjection = useCallback(async () => {
    try {
      const res = await getVectorProjection();
      setProjectionPoints(res.points);
    } catch {
      setProjectionPoints([]);
    }
  }, []);

  // ---------------------------------------------------------
  // Search tab
  // ---------------------------------------------------------
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchDurationMs, setSearchDurationMs] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRunLoading(true);
    setSearchError(null);
    setActiveTab("search");
    setSelectedPoint(null);

    const started = performance.now();

    try {
      const [searchResponse, projection] = await Promise.all([
        search(trimmed, k, algorithm, metric),
        getVectorProjection(trimmed),
      ]);

      setSearchResults(searchResponse.results);
      setSearchDurationMs(performance.now() - started);
      setProjectionPoints(projection.points);
      setProjectionQuery(projection.query);
      setHighlightedIds(new Set(searchResponse.results.map((r) => r.id)));
    } catch {
      setSearchError("Search failed. Is the vector engine running?");
      setSearchResults([]);
    } finally {
      setRunLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Ask AI tab
  // ---------------------------------------------------------
  const [chatTurns, setChatTurns] = useState<Turn[]>([]);
  const [askLoading, setAskLoading] = useState(false);

  async function submitAsk(question: string) {
    setAskLoading(true);
    setSelectedPoint(null);

    try {
      const [result, projection] = await Promise.all([
        ask(question),
        getVectorProjection(question),
      ]);

      setChatTurns((prev) => [
        ...prev,
        {
          question,
          answer: result.answer,
          sources: result.sources,
          grounded: result.grounded,
        },
      ]);
      setProjectionPoints(projection.points);
      setProjectionQuery(projection.query);
      setHighlightedIds(new Set(result.sources.map((s) => s.id)));
    } catch {
      setChatTurns((prev) => [
        ...prev,
        {
          question,
          answer:
            "Could not get an answer. Check that the API and LLM provider are running.",
          sources: [],
          grounded: true,
        },
      ]);
    } finally {
      setAskLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Documents tab actions
  // ---------------------------------------------------------
  async function handleUpload(file: File) {
    const result = await uploadDocument(file);

    if (result.error) {
      return { error: result.error };
    }

    await Promise.all([refreshDocuments(), refreshStats(), refreshProjection()]);
  }

  async function handleDelete(id: number) {
    await deleteDocument(id);
    await Promise.all([refreshDocuments(), refreshStats(), refreshProjection()]);
  }

  // ---------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------
  useEffect(() => {
    refreshDocuments();
    refreshStats();
    refreshProjection();
    getConfig().then(setConfig).catch(() => setConfig(null));
  }, [refreshDocuments, refreshStats, refreshProjection]);

  // ---------------------------------------------------------
  // Entrance animation — the workspace should feel like it's
  // arriving, not just appearing, especially right after the
  // landing page's own motion.
  // ---------------------------------------------------------
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .from("[data-ws-topbar]", { opacity: 0, y: -10, duration: 0.4 })
        .from(
          "[data-ws-left]",
          { opacity: 0, x: -12, duration: 0.45 },
          "-=0.25",
        )
        .from(
          "[data-ws-center]",
          { opacity: 0, scale: 0.98, duration: 0.5 },
          "-=0.3",
        )
        .from(
          "[data-ws-right]",
          { opacity: 0, x: 12, duration: 0.45 },
          "-=0.4",
        )
        .from("[data-ws-status]", { opacity: 0, duration: 0.3 }, "-=0.2");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="flex h-full flex-col">
      <div data-ws-topbar>
        <TopBar vectorCount={vectorCount} />
      </div>

      <div className="flex min-h-0 flex-1">
        <LeftPanel
          query={query}
          onQueryChange={setQuery}
          algorithm={algorithm}
          onAlgorithmChange={handleAlgorithmChange}
          metric={metric}
          onMetricChange={handleMetricChange}
          k={k}
          onKChange={setK}
          onRun={runSearch}
          loading={runLoading}
        />

        <div data-ws-center className="relative min-h-0 flex-1 bg-canvas">
          {projectionPoints.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
              No vectors indexed yet. Upload a document from the Documents tab.
            </div>
          )}

          {projectionPoints.length > 0 && (
            <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
              <VectorLabScene
                points={projectionPoints}
                queryCoord={projectionQuery}
                highlightedIds={highlightedIds}
                selectedId={selectedPoint?.id ?? null}
                onSelect={setSelectedPoint}
              />
            </Canvas>
          )}

          {selectedPoint && (
            <div className="absolute right-4 top-4 w-72 rounded-lg border border-border bg-surface/95 p-4 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {selectedPoint.source} — p{selectedPoint.page}, c{selectedPoint.chunk}
                </p>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="shrink-0 text-muted hover:text-ink-soft"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 max-h-64 overflow-auto text-sm text-ink-soft">
                {selectedPoint.text}
              </p>
            </div>
          )}
        </div>

        <RightPanel activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === "overview" && (
            <OverviewTab
              documentCount={documents.length}
              vectorCount={vectorCount}
              documents={documents}
            />
          )}
          {activeTab === "search" && (
            <SearchTab
              results={searchResults}
              loading={runLoading}
              error={searchError}
              durationMs={searchDurationMs}
            />
          )}
          {activeTab === "documents" && (
            <DocumentsTab
              documents={documents}
              loading={documentsLoading}
              onUpload={handleUpload}
              onDelete={handleDelete}
            />
          )}
          {activeTab === "ask" && (
            <AskTab turns={chatTurns} loading={askLoading} onAsk={submitAsk} />
          )}
          {activeTab === "settings" && (
            <SettingsTab config={config} vectorCount={vectorCount} />
          )}
        </RightPanel>
      </div>

      <StatusBar />
    </div>
  );
}
