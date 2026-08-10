#pragma once

#include "brute_force.h"
#include "kd_tree.h"
#include "hnsw.h"
#include "vector_record.h"

#include <cstddef>
#include <string>
#include <utility>
#include <vector>

class VectorDB {
public:

    VectorDB(int dimensions);

    void insert(
        int id,
        const std::vector<float>& vector,
        const std::string& text,
        const std::string& source,
        int page,
        int chunk
    );

    bool erase(int id);

    std::vector<std::pair<float, int>> search(
        const std::vector<float>& query,
        int k,
        const std::string& algorithm,
        const std::string& metric = "cosine"
    );

    const VectorRecord* get(int id) const;

    size_t size() const;

private:

    int dimensions;

    // Complete stored records.
    std::vector<VectorRecord> records;

    // Actual user-provided IDs.
    // ids[i] corresponds to records[i].
    std::vector<int> ids;

    BruteForce bruteForce;
    KDTree kdTree;
    HNSW hnsw;
};