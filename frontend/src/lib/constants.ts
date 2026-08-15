export const ALGORITHMS = ["hnsw", "kdtree", "bruteforce"] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export const METRICS = ["cosine", "euclidean", "manhattan"] as const;
export type Metric = (typeof METRICS)[number];

export const TABS = [
  { key: "overview", label: "Overview" },
  { key: "search", label: "Search" },
  { key: "documents", label: "Documents" },
  { key: "ask", label: "Ask AI" },
  { key: "settings", label: "Settings" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];
