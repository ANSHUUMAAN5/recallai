const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HealthStatus {
  status: string;
  service: string;
}

export interface Stats {
  count: number;
}

export interface DocumentSummary {
  id: number;
  filename: string;
  upload_time: string;
  chunks: number;
}

export interface UploadResult {
  status: string;
  document_id: number | null;
  filename: string;
  chunks_inserted: number;
  error?: string;
}

export interface Source {
  source: string;
  page: number;
  chunk: number;
}

export interface AskResult {
  question: string;
  answer: string;
  sources: Source[];
}

export interface Config {
  llm_provider: string;
  llm_model: string;
}

export interface SearchResult {
  id: number;
  distance: number;
  document_id: number;
  text: string;
  source: string;
  page: number;
  chunk: number;
}

export interface SearchResponse {
  algorithm: string;
  metric: string;
  results: SearchResult[];
}

export interface ProjectionPoint {
  id: number;
  document_id: number;
  text: string;
  source: string;
  page: number;
  chunk: number;
  x: number;
  y: number;
  z: number;
}

export interface ProjectionCoord {
  x: number;
  y: number;
  z: number;
}

export interface ProjectionResponse {
  points: ProjectionPoint[];
  query: ProjectionCoord | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    throw new Error(`${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>("/health");
}

export function getVectorEngineHealth(): Promise<HealthStatus> {
  return request<HealthStatus>("/vector-engine/health");
}

export function getStats(): Promise<Stats> {
  return request<Stats>("/stats");
}

export function listDocuments(): Promise<{ documents: DocumentSummary[] }> {
  return request<{ documents: DocumentSummary[] }>("/documents");
}

export function deleteDocument(id: number): Promise<{ status?: string; error?: string }> {
  return request(`/documents/${id}`, { method: "DELETE" });
}

export function uploadDocument(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  return request<UploadResult>("/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export function ask(question: string, k = 3): Promise<AskResult> {
  return request<AskResult>("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, k }),
  });
}

export function getConfig(): Promise<Config> {
  return request<Config>("/config");
}

export function search(
  query: string,
  k = 5,
  algorithm = "hnsw",
  metric = "cosine"
): Promise<SearchResponse> {
  return request<SearchResponse>("/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, k, algorithm, metric }),
  });
}

export function getVectorProjection(query?: string): Promise<ProjectionResponse> {
  return request<ProjectionResponse>("/vectors/projection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query || null }),
  });
}
