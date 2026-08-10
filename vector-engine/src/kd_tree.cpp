#include "kd_tree.h"
#include "distance.h"

#include <algorithm>
#include <cmath>
#include <limits>

KDTree::Node* KDTree::buildTree(
    std::vector<int>& indices,
    int depth
) {
    if (indices.empty()) {
        return nullptr;
    }

    int axis = depth % vectors[0].size();

    std::sort(
        indices.begin(),
        indices.end(),
        [&](int a, int b) {
            return vectors[a][axis] < vectors[b][axis];
        }
    );

    int middle = indices.size() / 2;

    Node* node = new Node(
        indices[middle],
        axis
    );

    std::vector<int> leftIndices(
        indices.begin(),
        indices.begin() + middle
    );

    std::vector<int> rightIndices(
        indices.begin() + middle + 1,
        indices.end()
    );

    node->left = buildTree(
        leftIndices,
        depth + 1
    );

    node->right = buildTree(
        rightIndices,
        depth + 1
    );

    return node;
}

void KDTree::build(
    const std::vector<std::vector<float>>& inputVectors
) {
    freeTree(root);

    vectors = inputVectors;

    if (vectors.empty()) {
        root = nullptr;
        return;
    }

    std::vector<int> indices(vectors.size());

    for (int i = 0;
         i < static_cast<int>(vectors.size());
         i++) {
        indices[i] = i;
    }

    root = buildTree(indices, 0);
}

void KDTree::searchTree(
    Node* node,
    const std::vector<float>& query,
    int k,
    DistanceMetric metric,
    std::vector<std::pair<float, int>>& results
) {
    if (!node) {
        return;
    }

    float distance = calculateDistance(
        vectors[node->index],
        query,
        metric
    );

    results.push_back({
        distance,
        node->index
    });

    std::sort(
        results.begin(),
        results.end()
    );

    if (
        results.size() >
        static_cast<size_t>(k)
    ) {
        results.pop_back();
    }

    int axis = node->axis;

    float difference =
        query[axis] -
        vectors[node->index][axis];

    Node* first;
    Node* second;

    if (difference < 0) {
        first = node->left;
        second = node->right;
    } else {
        first = node->right;
        second = node->left;
    }

    searchTree(
        first,
        query,
        k,
        metric,
        results
    );

    float worstDistance =
        results.empty()
            ? std::numeric_limits<float>::max()
            : results.back().first;

    if (
        results.size() <
            static_cast<size_t>(k)
        ||
        std::abs(difference) < worstDistance
    ) {
        searchTree(
            second,
            query,
            k,
            metric,
            results
        );
    }
}

std::vector<std::pair<float, int>> KDTree::search(
    const std::vector<float>& query,
    int k,
    DistanceMetric metric
) {
    std::vector<std::pair<float, int>> results;

    if (!root || k <= 0) {
        return results;
    }

    searchTree(
        root,
        query,
        k,
        metric,
        results
    );

    return results;
}

void KDTree::freeTree(Node* node) {
    if (!node) {
        return;
    }

    freeTree(node->left);
    freeTree(node->right);

    delete node;
}