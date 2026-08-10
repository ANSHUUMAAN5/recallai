#pragma once
#include "distance.h"
#include <cstddef>
#include <utility>
#include <vector>
#include <unordered_map>
#include <random>

class HNSW {
public:
    HNSW(int dimensions, int maxConnections = 16);

    void insert(
        int id,
        const std::vector<float>& vector,
        DistanceMetric metric = DistanceMetric::Cosine
    );

    std::vector<std::pair<float, int>> search(
        const std::vector<float>& query,
        int k,
        int efSearch = 50,
        DistanceMetric metric = DistanceMetric::Cosine
    );

    std::size_t size() const;

private:
    struct Node {
        int id;
        std::vector<float> vector;
        int maxLevel;
        std::vector<std::vector<int>> neighbors;
    };

    int dimensions;
    int maxConnections;

    // Layer-0 uses more connections than upper layers.
    int maxConnectionsLayer0;

    // HNSW graph.
    std::unordered_map<int, Node> graph;

    // Entry point for navigating the graph.
    int entryPoint;

    // Highest layer currently present.
    int topLayer;

    // Random number generator for assigning node levels.
    std::mt19937 rng;

    // Probability parameter for level generation.
    float levelMultiplier;

    int randomLevel();

    std::vector<std::pair<float, int>> searchLayer(
        const std::vector<float>& query,
        int entryPoint,
        int ef,
        int layer,
        DistanceMetric metric
    );

    std::vector<int> selectNeighbors(
        std::vector<std::pair<float, int>>& candidates,
        int maxNeighbors
    );

    void connectNeighbors(
        int nodeId,
        const std::vector<int>& neighbors,
        int layer,
        DistanceMetric metric
    );
};