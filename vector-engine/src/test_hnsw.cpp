#include "hnsw.h"
#include <iostream>

int main() {

    HNSW index(2);

    index.insert(0, {1.0f, 0.0f});
    index.insert(1, {0.0f, 1.0f});
    index.insert(2, {0.9f, 0.1f});
    index.insert(3, {0.1f, 0.9f});

    std::vector<float> query = {1.0f, 0.0f};

    auto results = index.search(query, 2);

    for (const auto& result : results) {
        std::cout
            << "ID: " << result.second
            << " Distance: " << result.first
            << '\n';
    }

    return 0;
}