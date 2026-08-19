// Real output from vector-engine/src/benchmark.cpp, run locally
// against 384-D synthetic unit vectors (same dimensionality and
// normalization as the real MiniLM embeddings this project
// actually indexes). See benchmarks/results.json for the raw
// output and the README for how to reproduce it.

export interface AlgorithmResult {
  name: "bruteforce" | "kdtree" | "hnsw";
  recall_at_k: number;
  avg_latency_us: number;
}

export interface SizeResult {
  corpus_size: number;
  algorithms: AlgorithmResult[];
}

export const BENCHMARK = {
  dimensions: 384,
  k: 10,
  queries_per_size: 50,
  results: [
    {
      corpus_size: 100,
      algorithms: [
        { name: "bruteforce", recall_at_k: 1, avg_latency_us: 42.5584 },
        { name: "kdtree", recall_at_k: 1, avg_latency_us: 44.8816 },
        { name: "hnsw", recall_at_k: 1, avg_latency_us: 73.17 },
      ],
    },
    {
      corpus_size: 500,
      algorithms: [
        { name: "bruteforce", recall_at_k: 1, avg_latency_us: 182.219 },
        { name: "kdtree", recall_at_k: 1, avg_latency_us: 183.653 },
        { name: "hnsw", recall_at_k: 0.99, avg_latency_us: 226.76 },
      ],
    },
    {
      corpus_size: 1000,
      algorithms: [
        { name: "bruteforce", recall_at_k: 1, avg_latency_us: 368.752 },
        { name: "kdtree", recall_at_k: 1, avg_latency_us: 365.917 },
        { name: "hnsw", recall_at_k: 0.938, avg_latency_us: 361.186 },
      ],
    },
    {
      corpus_size: 2500,
      algorithms: [
        { name: "bruteforce", recall_at_k: 1, avg_latency_us: 933.85 },
        { name: "kdtree", recall_at_k: 1, avg_latency_us: 954.792 },
        { name: "hnsw", recall_at_k: 0.742, avg_latency_us: 576.845 },
      ],
    },
    {
      corpus_size: 5000,
      algorithms: [
        { name: "bruteforce", recall_at_k: 1, avg_latency_us: 1917 },
        { name: "kdtree", recall_at_k: 1, avg_latency_us: 2196.48 },
        { name: "hnsw", recall_at_k: 0.582, avg_latency_us: 843.917 },
      ],
    },
  ] satisfies SizeResult[],
};
