#pragma once

#include "brute_force.h"
#include "kd_tree.h"
#include "hnsw.h"
#include "vector_record.h"
#include "document_record.h"
#include "persistence.h"

#include <cstddef>
#include <string>
#include <utility>
#include <vector>

class VectorDB {

public:

    VectorDB(int dimensions);


    // =====================================================
    // Documents
    // =====================================================

    int addDocument(
        const std::string& filename,
        const std::string& uploadTime
    );

    bool deleteDocument(
        int documentId
    );

    const DocumentRecord* getDocument(
        int documentId
    ) const;

    std::vector<DocumentRecord> getDocuments() const;

    int nextDocumentId() const;


    // =====================================================
    // Vectors
    // =====================================================

    void insert(
        int id,
        int documentId,
        const std::vector<float>& vector,
        const std::string& text,
        const std::string& source,
        int page,
        int chunk,
        bool persist = true
    );

    // Writes current in-memory state to disk. Used after a run of
    // insert(..., persist=false) calls, so a whole document's
    // worth of chunks costs one rewrite of the persistence file
    // instead of one rewrite per chunk.
    void flush();

    bool erase(int id);


    std::vector<std::pair<float, int>> search(
        const std::vector<float>& query,
        int k,
        const std::string& algorithm,
        const std::string& metric = "cosine"
    );


    const VectorRecord* get(
        int id
    ) const;

    std::vector<VectorRecord> getAllVectors() const;


    size_t size() const;

    int nextId() const;


private:

    int dimensions;


    // =====================================================
    // Documents
    // =====================================================

    std::vector<DocumentRecord> documents;


    // =====================================================
    // Vector records
    // =====================================================

    std::vector<VectorRecord> records;


    // Actual vector IDs
    std::vector<int> ids;


    // =====================================================
    // Search indexes
    // =====================================================

    BruteForce bruteForce;

    KDTree kdTree;

    HNSW hnsw;


    // =====================================================
    // Persistence
    // =====================================================

    std::string persistenceFile;
};