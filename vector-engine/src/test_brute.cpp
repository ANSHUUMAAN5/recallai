#include "brute_force.h"
#include "distance.h"

#include <iostream>
#include <vector>
int main() {
    std::vector<std::vector<float>> vectors = {
        {1.0f, 0.0f},
        {0.0f, 1.0f},
        {0.9f, 0.1f}
    };

    std::vector<float> query = {1.0f, 0.0f};

    BruteForce searcher;

    auto results = searcher.search(
        vectors,
        query,
        2,
        DistanceMetric::Cosine
    );

    for (const auto& result : results) {
        std::cout << "ID: " << result.second
                  << " Distance: " << result.first << '\n';
    }

    return 0;
}