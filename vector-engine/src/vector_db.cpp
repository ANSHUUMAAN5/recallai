#include "vector_db.h"
#include "distance.h"

#include <stdexcept>
#include <string>

VectorDB::VectorDB(int dimensions)
    : dimensions(dimensions),
      bruteForce(),
      kdTree(),
      hnsw(dimensions) {
}

void VectorDB::insert(
    int id,
    const std::vector<float>& vector,
    const std::string& text,
    const std::string& source,
    int page,
    int chunk
) {
    // Validate vector dimension
    if (static_cast<int>(vector.size()) != dimensions) {
        throw std::invalid_argument(
            "Vector dimension does not match database dimension"
        );
    }

    // Prevent duplicate IDs
    for (int existingId : ids) {
        if (existingId == id) {
            throw std::invalid_argument(
                "Vector ID already exists: " +
                std::to_string(id)
            );
        }
    }

    // Store complete record
    records.push_back({
        id,
        vector,
        text,
        source,
        page,
        chunk
    });

    // Store ID mapping
    ids.push_back(id);

    // Build vectors for KD-Tree
    std::vector<std::vector<float>> vectors;

    for (const auto& record : records) {
        vectors.push_back(record.vector);
    }

    kdTree.build(vectors);

    // Add vector to HNSW
    hnsw.insert(
        id,
        vector,
        DistanceMetric::Cosine
    );
}

bool VectorDB::erase(int id) {

    for (size_t i = 0; i < records.size(); i++) {

        if (records[i].id == id) {

            // Remove record
            records.erase(
                records.begin() + i
            );

            // Remove corresponding ID
            ids.erase(
                ids.begin() + i
            );

            // Rebuild vector list
            std::vector<std::vector<float>> vectors;

            for (const auto& record : records) {
                vectors.push_back(record.vector);
            }

            // Rebuild KD-Tree
            kdTree.build(vectors);

            // Rebuild HNSW
            hnsw = HNSW(dimensions);

            for (const auto& record : records) {

                hnsw.insert(
                    record.id,
                    record.vector,
                    DistanceMetric::Cosine
                );
            }

            return true;
        }
    }

    return false;
}

std::vector<std::pair<float, int>> VectorDB::search(
    const std::vector<float>& query,
    int k,
    const std::string& algorithm,
    const std::string& metric
) {
    // Validate query dimension
    if (static_cast<int>(query.size()) != dimensions) {
        throw std::invalid_argument(
            "Query dimension does not match database dimension"
        );
    }

    // Validate k
    if (k <= 0) {
        throw std::invalid_argument(
            "k must be greater than 0"
        );
    }

    // Convert metric string
    DistanceMetric distanceMetric;

    if (metric == "cosine") {
        distanceMetric = DistanceMetric::Cosine;
    }
    else if (metric == "euclidean") {
        distanceMetric = DistanceMetric::Euclidean;
    }
    else if (metric == "manhattan") {
        distanceMetric = DistanceMetric::Manhattan;
    }
    else {
        throw std::invalid_argument(
            "Unknown distance metric: " + metric
        );
    }

    // =========================================================
    // Brute Force
    // =========================================================

    if (algorithm == "bruteforce") {

        std::vector<std::vector<float>> vectors;

        for (const auto& record : records) {
            vectors.push_back(record.vector);
        }

        auto results = bruteForce.search(
            vectors,
            query,
            k,
            distanceMetric
        );

        // Convert vector index -> actual ID
        for (auto& result : results) {
            result.second = ids[result.second];
        }

        return results;
    }

    // =========================================================
    // KD-Tree
    // =========================================================

    if (algorithm == "kdtree") {

        auto results = kdTree.search(
            query,
            k,
            distanceMetric
        );

        // Convert vector index -> actual ID
        for (auto& result : results) {
            result.second = ids[result.second];
        }

        return results;
    }

    // =========================================================
    // HNSW
    // =========================================================

    if (algorithm == "hnsw") {

        return hnsw.search(
            query,
            k,
            50,
            distanceMetric
        );
    }

    throw std::invalid_argument(
        "Unknown search algorithm: " + algorithm
    );
}

const VectorRecord* VectorDB::get(int id) const {

    for (const auto& record : records) {

        if (record.id == id) {
            return &record;
        }
    }

    return nullptr;
}

size_t VectorDB::size() const {
    return records.size();
}