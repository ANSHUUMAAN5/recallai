// =============================================================
// Recall@k / latency benchmark
//
// Measures brute-force (ground truth), KD-tree, and HNSW against
// each other on synthetic 384-D unit vectors (matching the real
// embedding dimensionality and normalization the project actually
// uses) across a range of corpus sizes.
//
// Recall@k is computed against brute-force's exact result set,
// since brute-force is definitionally correct — it's a full scan.
//
// Usage: ./benchmark [output.json]
// =============================================================

#include "brute_force.h"
#include "kd_tree.h"
#include "hnsw.h"
#include "distance.h"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <fstream>
#include <iostream>
#include <random>
#include <set>
#include <sstream>
#include <vector>

namespace {

constexpr int DIMENSIONS = 384;
constexpr int K = 10;
constexpr int QUERIES_PER_SIZE = 50;
constexpr int HNSW_EF_SEARCH = 50;
const std::vector<int> CORPUS_SIZES = {100, 500, 1000, 2500, 5000};

std::vector<float> randomUnitVector(std::mt19937& rng) {
    std::normal_distribution<float> dist(0.0f, 1.0f);

    std::vector<float> vector(DIMENSIONS);
    float normSquared = 0.0f;

    for (int i = 0; i < DIMENSIONS; i++) {
        vector[i] = dist(rng);
        normSquared += vector[i] * vector[i];
    }

    float norm = std::sqrt(normSquared);

    for (int i = 0; i < DIMENSIONS; i++) {
        vector[i] /= norm;
    }

    return vector;
}

double microsecondsSince(
    const std::chrono::high_resolution_clock::time_point& start
) {
    auto end = std::chrono::high_resolution_clock::now();
    return std::chrono::duration<double, std::micro>(end - start).count();
}

struct AlgorithmResult {
    std::string algorithm;
    double recallAtK;
    double avgLatencyUs;
};

struct SizeResult {
    int corpusSize;
    std::vector<AlgorithmResult> algorithms;
};

}  // namespace

int main(int argc, char** argv) {
    std::string outputPath = argc > 1 ? argv[1] : "results.json";

    // Separate, fixed RNG streams so results are reproducible
    // across runs but corpus and queries never overlap.
    std::mt19937 corpusRng(42);
    std::mt19937 queryRng(1337);

    std::vector<SizeResult> allResults;

    // Build the largest corpus once, then take prefixes of it for
    // smaller sizes -- so "500 vectors" is a real subset of "5000
    // vectors", not a differently-seeded, unrelated set.
    int maxSize = *std::max_element(CORPUS_SIZES.begin(), CORPUS_SIZES.end());

    std::vector<std::vector<float>> fullCorpus;
    fullCorpus.reserve(maxSize);

    for (int i = 0; i < maxSize; i++) {
        fullCorpus.push_back(randomUnitVector(corpusRng));
    }

    std::vector<std::vector<float>> allQueries;
    allQueries.reserve(QUERIES_PER_SIZE);

    for (int i = 0; i < QUERIES_PER_SIZE; i++) {
        allQueries.push_back(randomUnitVector(queryRng));
    }

    for (int corpusSize : CORPUS_SIZES) {
        std::cout << "Running corpus size " << corpusSize << "...\n";

        std::vector<std::vector<float>> corpus(
            fullCorpus.begin(),
            fullCorpus.begin() + corpusSize
        );

        KDTree kdTree;
        kdTree.build(corpus);

        HNSW hnsw(DIMENSIONS);
        for (int i = 0; i < corpusSize; i++) {
            hnsw.insert(i, corpus[i], DistanceMetric::Cosine);
        }

        BruteForce bruteForce;

        double bruteForceTotalUs = 0.0;
        double kdTreeTotalUs = 0.0;
        double hnswTotalUs = 0.0;

        int kdTreeHits = 0;
        int hnswHits = 0;

        for (const auto& query : allQueries) {
            auto bfStart = std::chrono::high_resolution_clock::now();
            auto bfResults = bruteForce.search(
                corpus, query, K, DistanceMetric::Cosine
            );
            bruteForceTotalUs += microsecondsSince(bfStart);

            std::set<int> groundTruth;
            for (const auto& [distance, index] : bfResults) {
                groundTruth.insert(index);
            }

            auto kdStart = std::chrono::high_resolution_clock::now();
            auto kdResults = kdTree.search(query, K, DistanceMetric::Cosine);
            kdTreeTotalUs += microsecondsSince(kdStart);

            for (const auto& [distance, index] : kdResults) {
                if (groundTruth.count(index)) kdTreeHits++;
            }

            auto hnswStart = std::chrono::high_resolution_clock::now();
            auto hnswResults = hnsw.search(
                query, K, HNSW_EF_SEARCH, DistanceMetric::Cosine
            );
            hnswTotalUs += microsecondsSince(hnswStart);

            for (const auto& [distance, index] : hnswResults) {
                if (groundTruth.count(index)) hnswHits++;
            }
        }

        int totalPossibleHits = QUERIES_PER_SIZE * K;

        SizeResult result;
        result.corpusSize = corpusSize;
        result.algorithms = {
            {
                "bruteforce",
                1.0,
                bruteForceTotalUs / QUERIES_PER_SIZE,
            },
            {
                "kdtree",
                static_cast<double>(kdTreeHits) / totalPossibleHits,
                kdTreeTotalUs / QUERIES_PER_SIZE,
            },
            {
                "hnsw",
                static_cast<double>(hnswHits) / totalPossibleHits,
                hnswTotalUs / QUERIES_PER_SIZE,
            },
        };

        allResults.push_back(result);
    }

    // -----------------------------------------------------------
    // Write JSON
    // -----------------------------------------------------------

    std::ofstream out(outputPath);

    out << "{\n";
    out << "  \"dimensions\": " << DIMENSIONS << ",\n";
    out << "  \"k\": " << K << ",\n";
    out << "  \"queries_per_size\": " << QUERIES_PER_SIZE << ",\n";
    out << "  \"results\": [\n";

    for (size_t i = 0; i < allResults.size(); i++) {
        const auto& sizeResult = allResults[i];

        out << "    {\n";
        out << "      \"corpus_size\": " << sizeResult.corpusSize << ",\n";
        out << "      \"algorithms\": [\n";

        for (size_t j = 0; j < sizeResult.algorithms.size(); j++) {
            const auto& algo = sizeResult.algorithms[j];

            out << "        {\n";
            out << "          \"name\": \"" << algo.algorithm << "\",\n";
            out << "          \"recall_at_k\": " << algo.recallAtK << ",\n";
            out << "          \"avg_latency_us\": " << algo.avgLatencyUs << "\n";
            out << "        }" << (j + 1 < sizeResult.algorithms.size() ? "," : "") << "\n";
        }

        out << "      ]\n";
        out << "    }" << (i + 1 < allResults.size() ? "," : "") << "\n";
    }

    out << "  ]\n";
    out << "}\n";

    std::cout << "Wrote " << outputPath << "\n";

    return 0;
}
