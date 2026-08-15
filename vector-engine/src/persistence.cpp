#include "persistence.h"

#include <fstream>
#include <stdexcept>
#include <utility>


// =========================================================
// Helper: write string
// =========================================================

static void writeString(
    std::ofstream& out,
    const std::string& value
) {

    size_t size = value.size();

    out.write(
        reinterpret_cast<const char*>(&size),
        sizeof(size)
    );

    if (size > 0) {

        out.write(
            value.data(),
            size
        );
    }
}


// =========================================================
// Helper: read string
// =========================================================

static std::string readString(
    std::ifstream& in
) {

    size_t size = 0;

    in.read(
        reinterpret_cast<char*>(&size),
        sizeof(size)
    );

    if (!in) {

        throw std::runtime_error(
            "Invalid persistence file while reading string size"
        );
    }


    std::string value;

    value.resize(size);

    if (size > 0) {

        in.read(
            &value[0],
            size
        );
    }


    if (!in) {

        throw std::runtime_error(
            "Invalid persistence file while reading string"
        );
    }


    return value;
}


// =========================================================
// SAVE
// =========================================================

void Persistence::save(
    const std::string& filename,
    const std::vector<DocumentRecord>& documents,
    const std::vector<VectorRecord>& records
) {

    std::ofstream out(
        filename,
        std::ios::binary | std::ios::trunc
    );


    if (!out) {

        throw std::runtime_error(
            "Could not open persistence file for writing: " +
            filename
        );
    }


    // =====================================================
    // File version
    // =====================================================

    int version = 2;

    out.write(
        reinterpret_cast<const char*>(&version),
        sizeof(version)
    );


    // =====================================================
    // DOCUMENTS
    // =====================================================

    size_t documentCount =
        documents.size();

    out.write(
        reinterpret_cast<const char*>(&documentCount),
        sizeof(documentCount)
    );


    for (const auto& document : documents) {

        // -------------------------------------------------
        // Document ID
        // -------------------------------------------------

        out.write(
            reinterpret_cast<const char*>(&document.id),
            sizeof(document.id)
        );


        // -------------------------------------------------
        // Filename
        // -------------------------------------------------

        writeString(
            out,
            document.filename
        );


        // -------------------------------------------------
        // Upload time
        // -------------------------------------------------

        writeString(
            out,
            document.uploadTime
        );


        // -------------------------------------------------
        // Vector IDs
        // -------------------------------------------------

        size_t vectorIdCount =
            document.vectorIds.size();

        out.write(
            reinterpret_cast<const char*>(&vectorIdCount),
            sizeof(vectorIdCount)
        );


        for (int vectorId : document.vectorIds) {

            out.write(
                reinterpret_cast<const char*>(&vectorId),
                sizeof(vectorId)
            );
        }
    }


    // =====================================================
    // VECTOR RECORDS
    // =====================================================

    size_t recordCount =
        records.size();

    out.write(
        reinterpret_cast<const char*>(&recordCount),
        sizeof(recordCount)
    );


    for (const auto& record : records) {

        // -------------------------------------------------
        // Vector ID
        // -------------------------------------------------

        out.write(
            reinterpret_cast<const char*>(&record.id),
            sizeof(record.id)
        );


        // -------------------------------------------------
        // Parent document ID
        // -------------------------------------------------

        out.write(
            reinterpret_cast<const char*>(&record.documentId),
            sizeof(record.documentId)
        );


        // -------------------------------------------------
        // Page
        // -------------------------------------------------

        out.write(
            reinterpret_cast<const char*>(&record.page),
            sizeof(record.page)
        );


        // -------------------------------------------------
        // Chunk
        // -------------------------------------------------

        out.write(
            reinterpret_cast<const char*>(&record.chunk),
            sizeof(record.chunk)
        );


        // -------------------------------------------------
        // Embedding vector
        // -------------------------------------------------

        size_t vectorSize =
            record.vector.size();

        out.write(
            reinterpret_cast<const char*>(&vectorSize),
            sizeof(vectorSize)
        );


        if (vectorSize > 0) {

            out.write(
                reinterpret_cast<const char*>(
                    record.vector.data()
                ),
                vectorSize * sizeof(float)
            );
        }


        // -------------------------------------------------
        // Text
        // -------------------------------------------------

        writeString(
            out,
            record.text
        );


        // -------------------------------------------------
        // Source
        // -------------------------------------------------

        writeString(
            out,
            record.source
        );
    }


    // =====================================================
    // Validate write
    // =====================================================

    if (!out) {

        throw std::runtime_error(
            "Error while writing persistence file"
        );
    }
}


// =========================================================
// LOAD
// =========================================================

void Persistence::load(
    const std::string& filename,
    std::vector<DocumentRecord>& documents,
    std::vector<VectorRecord>& records
) {

    std::ifstream in(
        filename,
        std::ios::binary
    );


    // -----------------------------------------------------
    // First startup — no database yet
    // -----------------------------------------------------

    if (!in) {

        return;
    }


    // =====================================================
    // File version
    // =====================================================

    int version = 0;

    in.read(
        reinterpret_cast<char*>(&version),
        sizeof(version)
    );


    if (!in) {

        throw std::runtime_error(
            "Invalid persistence file"
        );
    }


    if (version != 2) {

        throw std::runtime_error(
            "Unsupported persistence file version"
        );
    }


    // =====================================================
    // DOCUMENTS
    // =====================================================

    size_t documentCount = 0;

    in.read(
        reinterpret_cast<char*>(&documentCount),
        sizeof(documentCount)
    );


    if (!in) {

        throw std::runtime_error(
            "Invalid document section"
        );
    }


    documents.clear();


    for (size_t i = 0;
         i < documentCount;
         i++) {

        DocumentRecord document;


        // -------------------------------------------------
        // Document ID
        // -------------------------------------------------

        in.read(
            reinterpret_cast<char*>(&document.id),
            sizeof(document.id)
        );


        // -------------------------------------------------
        // Filename
        // -------------------------------------------------

        document.filename =
            readString(in);


        // -------------------------------------------------
        // Upload time
        // -------------------------------------------------

        document.uploadTime =
            readString(in);


        // -------------------------------------------------
        // Vector IDs
        // -------------------------------------------------

        size_t vectorIdCount = 0;

        in.read(
            reinterpret_cast<char*>(&vectorIdCount),
            sizeof(vectorIdCount)
        );


        if (!in) {

            throw std::runtime_error(
                "Invalid document vector ID section"
            );
        }


        document.vectorIds.resize(
            vectorIdCount
        );


        for (size_t j = 0;
             j < vectorIdCount;
             j++) {

            in.read(
                reinterpret_cast<char*>(
                    &document.vectorIds[j]
                ),
                sizeof(int)
            );
        }


        if (!in) {

            throw std::runtime_error(
                "Invalid document record"
            );
        }


        documents.push_back(
            std::move(document)
        );
    }


    // =====================================================
    // VECTOR RECORDS
    // =====================================================

    size_t recordCount = 0;

    in.read(
        reinterpret_cast<char*>(&recordCount),
        sizeof(recordCount)
    );


    if (!in) {

        throw std::runtime_error(
            "Invalid vector record section"
        );
    }


    records.clear();


    for (size_t i = 0;
         i < recordCount;
         i++) {

        VectorRecord record;


        // -------------------------------------------------
        // Vector ID
        // -------------------------------------------------

        in.read(
            reinterpret_cast<char*>(&record.id),
            sizeof(record.id)
        );


        // -------------------------------------------------
        // Document ID
        // -------------------------------------------------

        in.read(
            reinterpret_cast<char*>(&record.documentId),
            sizeof(record.documentId)
        );


        // -------------------------------------------------
        // Page
        // -------------------------------------------------

        in.read(
            reinterpret_cast<char*>(&record.page),
            sizeof(record.page)
        );


        // -------------------------------------------------
        // Chunk
        // -------------------------------------------------

        in.read(
            reinterpret_cast<char*>(&record.chunk),
            sizeof(record.chunk)
        );


        // -------------------------------------------------
        // Embedding
        // -------------------------------------------------

        size_t vectorSize = 0;

        in.read(
            reinterpret_cast<char*>(&vectorSize),
            sizeof(vectorSize)
        );


        if (!in) {

            throw std::runtime_error(
                "Invalid vector size"
            );
        }


        record.vector.resize(
            vectorSize
        );


        if (vectorSize > 0) {

            in.read(
                reinterpret_cast<char*>(
                    record.vector.data()
                ),
                vectorSize * sizeof(float)
            );
        }


        // -------------------------------------------------
        // Text
        // -------------------------------------------------

        record.text =
            readString(in);


        // -------------------------------------------------
        // Source
        // -------------------------------------------------

        record.source =
            readString(in);


        // -------------------------------------------------
        // Validate
        // -------------------------------------------------

        if (!in) {

            throw std::runtime_error(
                "Invalid vector record"
            );
        }


        records.push_back(
            std::move(record)
        );
    }
}