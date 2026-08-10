#include "hnsw.h"
#include "distance.h"

#include <algorithm>
#include <cmath>
#include <functional>
#include <limits>
#include <queue>
#include <unordered_map>

HNSW::HNSW(int dimensions, int maxConnections)
    : dimensions(dimensions),
      maxConnections(maxConnections),
      maxConnectionsLayer0(2 * maxConnections),
      entryPoint(-1),
      topLayer(-1),
      rng(42),
      levelMultiplier(
          1.0f / std::log(
              static_cast<float>(maxConnections)
          )
      ) {
}

int HNSW::randomLevel() {
    std::uniform_real_distribution<float> distribution(
        0.0f,
        1.0f
    );

    float u = distribution(rng);

    if (u <= 0.0f) {
        u = 1e-6f;
    }

    return static_cast<int>(
        std::floor(
            -std::log(u) * levelMultiplier
        )
    );
}

std::vector<std::pair<float, int>> HNSW::searchLayer(
    const std::vector<float>& query,
    int entry,
    int ef,
    int layer,
    DistanceMetric metric
) {
    std::vector<std::pair<float, int>> result;

    if (!graph.count(entry)) {
        return result;
    }

    using MinHeap = std::priority_queue<
        std::pair<float, int>,
        std::vector<std::pair<float, int>>,
        std::greater<>
    >;

    using MaxHeap =
        std::priority_queue<std::pair<float, int>>;

    MinHeap candidates;
    MaxHeap found;

    std::unordered_map<int, bool> visited;

    float distance = calculateDistance(
        query,
        graph[entry].vector,
        metric
    );

    candidates.push({distance, entry});
    found.push({distance, entry});
    visited[entry] = true;

    while (!candidates.empty()) {

        auto [currentDistance, currentId] =
            candidates.top();

        candidates.pop();

        if (
            static_cast<int>(found.size()) >= ef &&
            currentDistance > found.top().first
        ) {
            break;
        }

        if (
            layer >=
            static_cast<int>(
                graph[currentId].neighbors.size()
            )
        ) {
            continue;
        }

        for (
            int neighborId :
            graph[currentId].neighbors[layer]
        ) {

            if (visited[neighborId]) {
                continue;
            }

            if (!graph.count(neighborId)) {
                continue;
            }

            visited[neighborId] = true;

            float neighborDistance =
                calculateDistance(
                    query,
                    graph[neighborId].vector,
                    metric
                );

            if (
                static_cast<int>(found.size()) < ef ||
                neighborDistance < found.top().first
            ) {
                candidates.push({
                    neighborDistance,
                    neighborId
                });

                found.push({
                    neighborDistance,
                    neighborId
                });

                if (
                    static_cast<int>(
                        found.size()
                    ) > ef
                ) {
                    found.pop();
                }
            }
        }
    }

    while (!found.empty()) {
        result.push_back(found.top());
        found.pop();
    }

    std::sort(
        result.begin(),
        result.end()
    );

    return result;
}

std::vector<int> HNSW::selectNeighbors(
    std::vector<std::pair<float, int>>& candidates,
    int maxNeighbors
) {
    std::sort(
        candidates.begin(),
        candidates.end()
    );

    std::vector<int> selected;

    int limit = std::min(
        static_cast<int>(candidates.size()),
        maxNeighbors
    );

    for (int i = 0; i < limit; i++) {
        selected.push_back(
            candidates[i].second
        );
    }

    return selected;
}

void HNSW::connectNeighbors(
    int nodeId,
    const std::vector<int>& neighbors,
    int layer,
    DistanceMetric metric
) {
    if (!graph.count(nodeId)) {
        return;
    }

    Node& node = graph[nodeId];

    if (
        layer >=
        static_cast<int>(
            node.neighbors.size()
        )
    ) {
        node.neighbors.resize(layer + 1);
    }

    node.neighbors[layer] = neighbors;

    int maxNeighbors =
        (layer == 0)
            ? maxConnectionsLayer0
            : maxConnections;

    for (int neighborId : neighbors) {

        if (!graph.count(neighborId)) {
            continue;
        }

        Node& neighbor = graph[neighborId];

        if (
            layer >=
            static_cast<int>(
                neighbor.neighbors.size()
            )
        ) {
            neighbor.neighbors.resize(
                layer + 1
            );
        }

        auto& connections =
            neighbor.neighbors[layer];

        connections.push_back(nodeId);

        if (
            static_cast<int>(
                connections.size()
            ) > maxNeighbors
        ) {

            std::vector<std::pair<float, int>>
                candidates;

            for (int id : connections) {

                if (!graph.count(id)) {
                    continue;
                }

                float distance =
                    calculateDistance(
                        neighbor.vector,
                        graph[id].vector,
                        metric
                    );

                candidates.push_back({
                    distance,
                    id
                });
            }

            std::sort(
                candidates.begin(),
                candidates.end()
            );

            connections.clear();

            int limit = std::min(
                maxNeighbors,
                static_cast<int>(
                    candidates.size()
                )
            );

            for (int i = 0; i < limit; i++) {
                connections.push_back(
                    candidates[i].second
                );
            }
        }
    }
}

void HNSW::insert(
    int id,
    const std::vector<float>& vector,
    DistanceMetric metric
) {
    if (
        static_cast<int>(vector.size()) !=
        dimensions
    ) {
        return;
    }

    int level = randomLevel();

    graph[id] = Node{
        id,
        vector,
        level,
        std::vector<std::vector<int>>(
            level + 1
        )
    };

    if (entryPoint == -1) {
        entryPoint = id;
        topLayer = level;
        return;
    }

    int currentEntry = entryPoint;

    // Navigate from the top layer downward.
    for (
        int layer = topLayer;
        layer > level;
        layer--
    ) {

        if (
            layer >=
            static_cast<int>(
                graph[currentEntry]
                    .neighbors.size()
            )
        ) {
            continue;
        }

        auto candidates =
            searchLayer(
                vector,
                currentEntry,
                1,
                layer,
                metric
            );

        if (!candidates.empty()) {
            currentEntry =
                candidates[0].second;
        }
    }

    // Insert into every layer belonging to this node.
    for (
        int layer =
            std::min(topLayer, level);
        layer >= 0;
        layer--
    ) {

        auto candidates =
            searchLayer(
                vector,
                currentEntry,
                50,
                layer,
                metric
            );

        int maxNeighbors =
            (layer == 0)
                ? maxConnectionsLayer0
                : maxConnections;

        auto selected =
            selectNeighbors(
                candidates,
                maxNeighbors
            );

        connectNeighbors(
            id,
            selected,
            layer,
            metric
        );

        if (!candidates.empty()) {
            currentEntry =
                candidates[0].second;
        }
    }

    // New highest-level node becomes entry point.
    if (level > topLayer) {
        topLayer = level;
        entryPoint = id;
    }
}

std::vector<std::pair<float, int>> HNSW::search(
    const std::vector<float>& query,
    int k,
    int efSearch,
    DistanceMetric metric
) {
    if (
        entryPoint == -1 ||
        k <= 0
    ) {
        return {};
    }

    int currentEntry = entryPoint;

    // Greedy navigation through upper layers.
    for (
        int layer = topLayer;
        layer > 0;
        layer--
    ) {

        if (
            layer >=
            static_cast<int>(
                graph[currentEntry]
                    .neighbors.size()
            )
        ) {
            continue;
        }

        auto candidates =
            searchLayer(
                query,
                currentEntry,
                1,
                layer,
                metric
            );

        if (!candidates.empty()) {
            currentEntry =
                candidates[0].second;
        }
    }

    // Detailed search at layer 0.
    auto results =
        searchLayer(
            query,
            currentEntry,
            std::max(efSearch, k),
            0,
            metric
        );

    if (
        static_cast<int>(
            results.size()
        ) > k
    ) {
        results.resize(k);
    }

    return results;
}

std::size_t HNSW::size() const {
    return graph.size();
}