#include "vector_db.h"
#include <iostream>
#include <vector>

int main() {

    VectorDB db(2);

    int documentId = db.addDocument(
        "test.txt",
        "2026-01-01T00:00:00Z"
    );

    db.insert(0, documentId, {1.0f, 0.0f}, "text-0", "test.txt", 1, 1);
    db.insert(1, documentId, {0.0f, 1.0f}, "text-1", "test.txt", 1, 2);
    db.insert(2, documentId, {0.9f, 0.1f}, "text-2", "test.txt", 1, 3);
    db.insert(3, documentId, {0.1f, 0.9f}, "text-3", "test.txt", 1, 4);

    std::vector<float> query = {1.0f, 0.0f};

    std::vector<std::string> algorithms = {
        "bruteforce",
        "kdtree",
        "hnsw"
    };

    std::vector<std::string> metrics = {
        "cosine",
        "euclidean",
        "manhattan"
    };

    for (const auto& metric : metrics) {

        std::cout << "\n========== "
                  << metric
                  << " ==========\n";

        for (const auto& algorithm : algorithms) {

            auto results = db.search(
                query,
                2,
                algorithm,
                metric
            );

            std::cout << "\n"
                      << algorithm
                      << ":\n";

            for (const auto& result : results) {
                std::cout
                    << "ID: " << result.second
                    << " Distance: "
                    << result.first
                    << '\n';
            }
        }
    }

    return 0;
}