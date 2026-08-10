#pragma once

#include <vector>

float euclideanDistance(
    const std::vector<float>& a,
    const std::vector<float>& b
);

float cosineDistance(
    const std::vector<float>& a,
    const std::vector<float>& b
);

float manhattanDistance(
    const std::vector<float>& a,
    const std::vector<float>& b
);
enum class DistanceMetric {
    Cosine,
    Euclidean,
    Manhattan
};

float calculateDistance(
    const std::vector<float>& a,
    const std::vector<float>& b,
    DistanceMetric metric
);