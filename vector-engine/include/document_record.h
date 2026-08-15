#pragma once

#include <string>
#include <vector>

struct DocumentRecord {

    // Unique document ID
    int id;

    // Original uploaded filename
    std::string filename;

    // ISO-8601 upload timestamp
    std::string uploadTime;

    // IDs of vector chunks belonging to this document
    std::vector<int> vectorIds;
};