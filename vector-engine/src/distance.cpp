#include "distance.h"
#include <cmath>

float euclideanDistance(
    const std::vector<float>& a,
    const std::vector<float>& b
) {
    float sum = 0.0f;

    for (size_t i = 0; i < a.size(); i++) {
        float difference = a[i] - b[i];
        sum += difference * difference;
    }

    return std::sqrt(sum);
}

float cosineDistance(
    const std::vector<float>& a,
    const std::vector<float>& b
) {
    float dot = 0.0f;
    float normA = 0.0f;
    float normB = 0.0f;

    for (size_t i = 0; i < a.size(); i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA < 1e-9f || normB < 1e-9f) {
        return 1.0f;
    }

    return 1.0f -
           dot / (std::sqrt(normA) * std::sqrt(normB));
}

float manhattanDistance(
    const std::vector<float>& a,
    const std::vector<float>& b
) {
    float sum = 0.0f;

    for (size_t i = 0; i < a.size(); i++) {
        sum += std::abs(a[i] - b[i]);
    }

    return sum;
}
float calculateDistance(
    const std::vector<float>& a,
    const std::vector<float>& b,
    DistanceMetric metric
) {
    switch (metric) {
        case DistanceMetric::Euclidean:
            return euclideanDistance(a, b);

        case DistanceMetric::Manhattan:
            return manhattanDistance(a, b);

        case DistanceMetric::Cosine:
        default:
            return cosineDistance(a, b);
    }
}