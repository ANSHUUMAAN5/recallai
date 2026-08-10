#include "vector_db.h"
#include <iostream>
#include <vector>

int main() {

    VectorDB db(2);

    db.insert(0, {1.0f, 0.0f});
    db.insert(1, {0.0f, 1.0f});
    db.insert(2, {0.9f, 0.1f});
    db.insert(3, {0.1f, 0.9f});

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