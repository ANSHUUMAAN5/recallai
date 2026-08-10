#pragma once
#include "distance.h"
#include <vector>
#include <utility>

class KDTree {
public:
    KDTree() = default;

    void build(const std::vector<std::vector<float>>& vectors);

    std::vector<std::pair<float, int>> search(
        const std::vector<float>& query,
        int k,
        DistanceMetric metric
    );

private:
    struct Node {
        int index;
        int axis;
        Node* left;
        Node* right;

        Node(int idx, int ax)
            : index(idx), axis(ax), left(nullptr), right(nullptr) {}
    };

    Node* root = nullptr;
    std::vector<std::vector<float>> vectors;

    Node* buildTree(std::vector<int>& indices, int depth);

    void searchTree(
        Node* node,
        const std::vector<float>& query,
        int k,
        DistanceMetric metric,
        std::vector<std::pair<float, int>>& results
    );

    void freeTree(Node* node);
};