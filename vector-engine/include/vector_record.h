#pragma once

#include <string>
#include <vector>

struct VectorRecord {

    // Unique vector/chunk ID
    int id;

    // Parent document ID
    int documentId;

    // Embedding vector
    std::vector<float> vector;

    // Original text/chunk
    std::string text;

    // Source filename
    std::string source;

    // Page number
    int page;

    // Chunk number
    int chunk;
};