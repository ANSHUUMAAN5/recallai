#pragma once

#include "document_record.h"
#include "vector_record.h"

#include <string>
#include <vector>

class Persistence {

public:

    static void save(
        const std::string& filename,
        const std::vector<DocumentRecord>& documents,
        const std::vector<VectorRecord>& records
    );


    static void load(
        const std::string& filename,
        std::vector<DocumentRecord>& documents,
        std::vector<VectorRecord>& records
    );
};

