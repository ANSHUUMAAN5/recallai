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
