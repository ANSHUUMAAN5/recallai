#pragma once

#include <string>
#include <vector>

struct VectorRecord {

    // Unique ID of this vector record
    int id;

    // Embedding vector
    std::vector<float> vector;

    // Original text/chunk
    std::string text;

    // Source document name
    std::string source;

    // Page number in the source document
    int page;

    // Chunk number within the document
    int chunk;
};