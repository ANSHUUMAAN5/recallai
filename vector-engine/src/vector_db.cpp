#include "vector_db.h"
#include "distance.h"

#include <ctime>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <string>


// =========================================================
// Helper: current UTC timestamp
//
// Example:
// 2026-08-11T07:30:00Z
// =========================================================

static std::string currentTimestamp() {

    std::time_t now =
        std::time(nullptr);

    std::tm utcTime{};

#if defined(_WIN32)

    gmtime_s(
        &utcTime,
        &now
    );

#else

    gmtime_r(
        &now,
        &utcTime
    );

#endif

    std::ostringstream timestamp;

    timestamp
        << std::put_time(
            &utcTime,
            "%Y-%m-%dT%H:%M:%SZ"
        );

    return timestamp.str();
}


// =========================================================
// Constructor
// =========================================================

VectorDB::VectorDB(int dimensions)
    : dimensions(dimensions),
      bruteForce(),
      kdTree(),
      hnsw(dimensions),
      persistenceFile("data/vectors.db") {

    // -----------------------------------------------------
    // Load documents and vector records
    // -----------------------------------------------------

    Persistence::load(
        persistenceFile,
        documents,
        records
    );


    // -----------------------------------------------------
    // Rebuild ID list
    // -----------------------------------------------------

    for (const auto& record : records) {

        ids.push_back(
            record.id
        );
    }


    // -----------------------------------------------------
    // Rebuild KD-Tree
    // -----------------------------------------------------

    if (!records.empty()) {

        std::vector<std::vector<float>> vectors;

        for (const auto& record : records) {

            vectors.push_back(
                record.vector
            );
        }

        kdTree.build(
            vectors
        );
    }


    // -----------------------------------------------------
    // Rebuild HNSW
    // -----------------------------------------------------

    for (const auto& record : records) {

        hnsw.insert(
            record.id,
            record.vector,
            DistanceMetric::Cosine
        );
    }
}


// =========================================================
// Add Document
// =========================================================

int VectorDB::addDocument(
    const std::string& filename,
    const std::string& uploadTime
) {

    // -----------------------------------------------------
    // Prevent duplicate filenames
    // -----------------------------------------------------

    for (const auto& document : documents) {

        if (document.filename == filename) {

            throw std::invalid_argument(
                "Document already exists: " +
                filename
            );
        }
    }


    // -----------------------------------------------------
    // Generate document ID
    // -----------------------------------------------------

    int documentId =
        nextDocumentId();


    // -----------------------------------------------------
    // Create document
    // -----------------------------------------------------

    DocumentRecord document;

    document.id =
        documentId;

    document.filename =
        filename;

    document.uploadTime =
        uploadTime;

    document.vectorIds.clear();


    documents.push_back(
        document
    );


    // -----------------------------------------------------
    // Persist immediately
    //
    // Even an empty document is stored.
    // Its chunks will be added afterward.
    // -----------------------------------------------------

    Persistence::save(
        persistenceFile,
        documents,
        records
    );


    return documentId;
}


// =========================================================
// Delete Document
// =========================================================

bool VectorDB::deleteDocument(
    int documentId
) {

    // -----------------------------------------------------
    // Find document
    // -----------------------------------------------------

    size_t documentIndex =
        documents.size();


    for (size_t i = 0;
         i < documents.size();
         i++) {

        if (documents[i].id == documentId) {

            documentIndex = i;
            break;
        }
    }


    if (documentIndex == documents.size()) {

        return false;
    }


    // -----------------------------------------------------
    // Collect vector IDs belonging to document
    // -----------------------------------------------------

    std::vector<int> vectorIds =
        documents[documentIndex].vectorIds;


    // -----------------------------------------------------
    // Remove vectors
    // -----------------------------------------------------

    for (int vectorId : vectorIds) {

        for (size_t i = 0;
             i < records.size();
             i++) {

            if (records[i].id == vectorId) {

                records.erase(
                    records.begin() + i
                );

                ids.erase(
                    ids.begin() + i
                );

                break;
            }
        }
    }


    // -----------------------------------------------------
    // Remove document
    // -----------------------------------------------------

    documents.erase(
        documents.begin() + documentIndex
    );


    // -----------------------------------------------------
    // Rebuild KD-Tree
    // -----------------------------------------------------

    if (!records.empty()) {

        std::vector<std::vector<float>> vectors;

        for (const auto& record : records) {

            vectors.push_back(
                record.vector
            );
        }

        kdTree.build(
            vectors
        );
    }


    // -----------------------------------------------------
    // Rebuild HNSW
    // -----------------------------------------------------

    hnsw =
        HNSW(dimensions);

    for (const auto& record : records) {

        hnsw.insert(
            record.id,
            record.vector,
            DistanceMetric::Cosine
        );
    }


    // -----------------------------------------------------
    // Persist updated state
    // -----------------------------------------------------

    Persistence::save(
        persistenceFile,
        documents,
        records
    );


    return true;
}


// =========================================================
// Get Document
// =========================================================

const DocumentRecord* VectorDB::getDocument(
    int documentId
) const {

    for (const auto& document : documents) {

        if (document.id == documentId) {

            return &document;
        }
    }


    return nullptr;
}


// =========================================================
// Get All Documents
// =========================================================

std::vector<DocumentRecord> VectorDB::getDocuments() const {

    return documents;
}


// =========================================================
// Get All Vectors
// =========================================================

std::vector<VectorRecord> VectorDB::getAllVectors() const {

    return records;
}


// =========================================================
// Next Document ID
// =========================================================

int VectorDB::nextDocumentId() const {

    if (documents.empty()) {

        return 1;
    }


    int maximumId =
        documents[0].id;


    for (const auto& document : documents) {

        if (document.id > maximumId) {

            maximumId =
                document.id;
        }
    }


    return maximumId + 1;
}


// =========================================================
// Insert Vector
// =========================================================

void VectorDB::insert(
    int id,
    int documentId,
    const std::vector<float>& vector,
    const std::string& text,
    const std::string& source,
    int page,
    int chunk,
    bool persist
) {

    // -----------------------------------------------------
    // Validate vector dimension
    // -----------------------------------------------------

    if (
        static_cast<int>(
            vector.size()
        ) != dimensions
    ) {

        throw std::invalid_argument(
            "Vector dimension does not match database dimension"
        );
    }


    // -----------------------------------------------------
    // Validate document exists
    // -----------------------------------------------------

    DocumentRecord* document =
        nullptr;


    for (auto& currentDocument : documents) {

        if (
            currentDocument.id ==
            documentId
        ) {

            document =
                &currentDocument;

            break;
        }
    }


    if (document == nullptr) {

        throw std::invalid_argument(
            "Document ID does not exist: " +
            std::to_string(documentId)
        );
    }


    // -----------------------------------------------------
    // Prevent duplicate vector IDs
    // -----------------------------------------------------

    for (int existingId : ids) {

        if (existingId == id) {

            throw std::invalid_argument(
                "Vector ID already exists: " +
                std::to_string(id)
            );
        }
    }


    // -----------------------------------------------------
    // Create VectorRecord
    // -----------------------------------------------------

    VectorRecord record;

    record.id =
        id;

    record.documentId =
        documentId;

    record.vector =
        vector;

    record.text =
        text;

    record.source =
        source;

    record.page =
        page;

    record.chunk =
        chunk;


    records.push_back(
        record
    );

    ids.push_back(
        id
    );


    // -----------------------------------------------------
    // Add vector ID to document
    // -----------------------------------------------------

    document->vectorIds.push_back(
        id
    );


    // -----------------------------------------------------
    // Rebuild KD-Tree
    // -----------------------------------------------------

    std::vector<std::vector<float>> vectors;

    for (const auto& currentRecord : records) {

        vectors.push_back(
            currentRecord.vector
        );
    }

    kdTree.build(
        vectors
    );


    // -----------------------------------------------------
    // Add to HNSW
    // -----------------------------------------------------

    hnsw.insert(
        id,
        vector,
        DistanceMetric::Cosine
    );


    // -----------------------------------------------------
    // Persist
    //
    // Skippable so a caller inserting many vectors in a row
    // (one document's worth of chunks) can defer the disk
    // write to a single flush() at the end instead of paying
    // a full-file rewrite per chunk.
    // -----------------------------------------------------

    if (persist) {

        Persistence::save(
            persistenceFile,
            documents,
            records
        );
    }
}


// =========================================================
// Flush
// =========================================================

void VectorDB::flush() {

    Persistence::save(
        persistenceFile,
        documents,
        records
    );
}


// =========================================================
// Erase Vector
// =========================================================

bool VectorDB::erase(
    int id
) {

    for (size_t i = 0;
         i < records.size();
         i++) {

        if (records[i].id == id) {

            int documentId =
                records[i].documentId;


            // -------------------------------------------------
            // Remove vector record
            // -------------------------------------------------

            records.erase(
                records.begin() + i
            );


            // -------------------------------------------------
            // Remove vector ID
            // -------------------------------------------------

            ids.erase(
                ids.begin() + i
            );


            // -------------------------------------------------
            // Remove vector ID from parent document
            // -------------------------------------------------

            for (
                auto& document :
                documents
            ) {

                if (
                    document.id ==
                    documentId
                ) {

                    for (
                        size_t j = 0;
                        j < document.vectorIds.size();
                        j++
                    ) {

                        if (
                            document.vectorIds[j] ==
                            id
                        ) {

                            document.vectorIds.erase(
                                document.vectorIds.begin() + j
                            );

                            break;
                        }
                    }

                    break;
                }
            }


            // -------------------------------------------------
            // Rebuild KD-Tree
            // -------------------------------------------------

            if (!records.empty()) {

                std::vector<std::vector<float>> vectors;

                for (
                    const auto& record :
                    records
                ) {

                    vectors.push_back(
                        record.vector
                    );
                }

                kdTree.build(
                    vectors
                );
            }


            // -------------------------------------------------
            // Rebuild HNSW
            // -------------------------------------------------

            hnsw =
                HNSW(dimensions);

            for (
                const auto& record :
                records
            ) {

                hnsw.insert(
                    record.id,
                    record.vector,
                    DistanceMetric::Cosine
                );
            }


            // -------------------------------------------------
            // Persist
            // -------------------------------------------------

            Persistence::save(
                persistenceFile,
                documents,
                records
            );


            return true;
        }
    }


    return false;
}


// =========================================================
// Search
// =========================================================

std::vector<std::pair<float, int>> VectorDB::search(
    const std::vector<float>& query,
    int k,
    const std::string& algorithm,
    const std::string& metric
) {

    // -----------------------------------------------------
    // Validate query dimension
    // -----------------------------------------------------

    if (
        static_cast<int>(
            query.size()
        ) != dimensions
    ) {

        throw std::invalid_argument(
            "Query dimension does not match database dimension"
        );
    }


    // -----------------------------------------------------
    // Validate k
    // -----------------------------------------------------

    if (k <= 0) {

        throw std::invalid_argument(
            "k must be greater than 0"
        );
    }


    // -----------------------------------------------------
    // Convert metric
    // -----------------------------------------------------

    DistanceMetric distanceMetric;


    if (metric == "cosine") {

        distanceMetric =
            DistanceMetric::Cosine;
    }

    else if (metric == "euclidean") {

        distanceMetric =
            DistanceMetric::Euclidean;
    }

    else if (metric == "manhattan") {

        distanceMetric =
            DistanceMetric::Manhattan;
    }

    else {

        throw std::invalid_argument(
            "Unknown distance metric: " +
            metric
        );
    }


    // =====================================================
    // Brute Force
    // =====================================================

    if (algorithm == "bruteforce") {

        std::vector<std::vector<float>> vectors;

        for (
            const auto& record :
            records
        ) {

            vectors.push_back(
                record.vector
            );
        }


        auto results =
            bruteForce.search(
                vectors,
                query,
                k,
                distanceMetric
            );


        for (auto& result : results) {

            result.second =
                ids[result.second];
        }


        return results;
    }


    // =====================================================
    // KD-Tree
    // =====================================================

    if (algorithm == "kdtree") {

        auto results =
            kdTree.search(
                query,
                k,
                distanceMetric
            );


        for (auto& result : results) {

            result.second =
                ids[result.second];
        }


        return results;
    }


    // =====================================================
    // HNSW
    // =====================================================

    if (algorithm == "hnsw") {

        return hnsw.search(
            query,
            k,
            50,
            distanceMetric
        );
    }


    throw std::invalid_argument(
        "Unknown search algorithm: " +
        algorithm
    );
}


// =========================================================
// Get VectorRecord
// =========================================================

const VectorRecord* VectorDB::get(
    int id
) const {

    for (
        const auto& record :
        records
    ) {

        if (record.id == id) {

            return &record;
        }
    }


    return nullptr;
}


// =========================================================
// Vector count
// =========================================================

size_t VectorDB::size() const {

    return records.size();
}


// =========================================================
// Next Vector ID
// =========================================================

int VectorDB::nextId() const {

    if (ids.empty()) {

        return 1;
    }


    int maximumId =
        ids[0];


    for (int id : ids) {

        if (id > maximumId) {

            maximumId =
                id;
        }
    }


    return maximumId + 1;
}