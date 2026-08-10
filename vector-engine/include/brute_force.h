#pragma once
#include "distance.h"
#include <vector>
#include <utility>

class BruteForce {
public:
    std::vector<std::pair<float, int>> search(
        const std::vector<std::vector<float>>& vectors,
        const std::vector<float>& query,
        int k,
        DistanceMetric metric
    );
};