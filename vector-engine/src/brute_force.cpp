#include "brute_force.h"
#include "distance.h"

#include <algorithm>

std::vector<std::pair<float, int>> BruteForce::search(
    const std::vector<std::vector<float>>& vectors,
    const std::vector<float>& query,
    int k,
    DistanceMetric metric
) {
    std::vector<std::pair<float, int>> results;

    for (int i = 0; i < static_cast<int>(vectors.size()); i++) {

        float distance = calculateDistance(
            vectors[i],
            query,
            metric
        );

        results.push_back({distance, i});
    }

    std::sort(results.begin(), results.end());

    if (k < static_cast<int>(results.size())) {
        results.resize(k);
    }

    return results;
}