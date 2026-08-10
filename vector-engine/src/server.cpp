#include "httplib.h"
#include "vector_db.h"

#include <iostream>
#include <sstream>
#include <string>
#include <vector>

// =========================================================
// Parse comma-separated vector
//
// Example:
// "1,0,0,0"
// ->
// {1.0f, 0.0f, 0.0f, 0.0f}
//
// Also works with 384-dimensional embeddings.
// =========================================================

std::vector<float> parseVector(
    const std::string& input
) {
    std::vector<float> result;

    std::stringstream ss(input);
    std::string value;

    while (std::getline(ss, value, ',')) {

        if (!value.empty()) {
            result.push_back(std::stof(value));
        }
    }

    return result;
}


int main() {

    // =====================================================
    // Vector Database
    //
    // all-MiniLM-L6-v2 -> 384 dimensions
    // =====================================================

    VectorDB db(384);

    httplib::Server server;


    // =====================================================
    // GET /health
    // =====================================================

    server.Get(
        "/health",
        [&](const httplib::Request&,
            httplib::Response& res) {

            res.set_content(
                R"({"status":"ok","service":"RecallAI Vector Engine"})",
                "application/json"
            );
        }
    );


    // =====================================================
    // GET /stats
    // =====================================================

    server.Get(
        "/stats",
        [&](const httplib::Request&,
            httplib::Response& res) {

            std::ostringstream json;

            json << "{";
            json << "\"count\":" << db.size();
            json << "}";

            res.set_content(
                json.str(),
                "application/json"
            );
        }
    );


    // =====================================================
    // POST /insert
    //
    // Metadata:
    //   id
    //   text
    //   source
    //   page
    //   chunk
    //
    // Vector:
    //   Preferred -> request body
    //   Fallback  -> ?vector=...
    // =====================================================

    server.Post(
        "/insert",
        [&](const httplib::Request& req,
            httplib::Response& res) {

            try {

                // -------------------------------------------------
                // Validate metadata
                // -------------------------------------------------

                if (
                    !req.has_param("id") ||
                    !req.has_param("text") ||
                    !req.has_param("source") ||
                    !req.has_param("page") ||
                    !req.has_param("chunk")
                ) {

                    res.status = 400;

                    res.set_content(
                        R"({"error":"id, text, source, page and chunk are required"})",
                        "application/json"
                    );

                    return;
                }


                // -------------------------------------------------
                // ID
                // -------------------------------------------------

                int id = std::stoi(
                    req.get_param_value("id")
                );


                // -------------------------------------------------
                // Vector
                //
                // New architecture:
                // 384-D vector is in request body.
                //
                // Old/manual architecture:
                // vector can still come from URL.
                // -------------------------------------------------

                std::vector<float> vector;

                if (!req.body.empty()) {

                    vector = parseVector(
                        req.body
                    );

                }
                else if (req.has_param("vector")) {

                    vector = parseVector(
                        req.get_param_value("vector")
                    );

                }
                else {

                    throw std::invalid_argument(
                        "vector is required"
                    );
                }


                // -------------------------------------------------
                // Text
                // -------------------------------------------------

                std::string text =
                    req.get_param_value("text");


                // -------------------------------------------------
                // Source
                // -------------------------------------------------

                std::string source =
                    req.get_param_value("source");


                // -------------------------------------------------
                // Page
                // -------------------------------------------------

                int page = std::stoi(
                    req.get_param_value("page")
                );


                // -------------------------------------------------
                // Chunk
                // -------------------------------------------------

                int chunk = std::stoi(
                    req.get_param_value("chunk")
                );


                // -------------------------------------------------
                // Insert
                // -------------------------------------------------

                db.insert(
                    id,
                    vector,
                    text,
                    source,
                    page,
                    chunk
                );


                // -------------------------------------------------
                // Response
                // -------------------------------------------------

                std::ostringstream json;

                json << "{";
                json << "\"status\":\"inserted\",";
                json << "\"id\":" << id;
                json << "}";

                res.set_content(
                    json.str(),
                    "application/json"
                );

            }
            catch (const std::exception& e) {

                res.status = 400;

                std::ostringstream json;

                json << "{";
                json << "\"error\":\""
                     << e.what()
                     << "\"";
                json << "}";

                res.set_content(
                    json.str(),
                    "application/json"
                );
            }
        }
    );


    // =====================================================
    // DELETE /delete
    // =====================================================

    server.Delete(
        "/delete",
        [&](const httplib::Request& req,
            httplib::Response& res) {

            try {

                if (!req.has_param("id")) {

                    res.status = 400;

                    res.set_content(
                        R"({"error":"id parameter is required"})",
                        "application/json"
                    );

                    return;
                }


                int id = std::stoi(
                    req.get_param_value("id")
                );


                bool deleted = db.erase(id);


                if (!deleted) {

                    res.status = 404;

                    res.set_content(
                        R"({"error":"Vector ID not found"})",
                        "application/json"
                    );

                    return;
                }


                std::ostringstream json;

                json << "{";
                json << "\"status\":\"deleted\",";
                json << "\"id\":" << id;
                json << "}";

                res.set_content(
                    json.str(),
                    "application/json"
                );

            }
            catch (const std::exception& e) {

                res.status = 400;

                std::ostringstream json;

                json << "{";
                json << "\"error\":\""
                     << e.what()
                     << "\"";
                json << "}";

                res.set_content(
                    json.str(),
                    "application/json"
                );
            }
        }
    );


    // =====================================================
    // GET /get
    // =====================================================

    server.Get(
        "/get",
        [&](const httplib::Request& req,
            httplib::Response& res) {

            try {

                if (!req.has_param("id")) {

                    res.status = 400;

                    res.set_content(
                        R"({"error":"id parameter is required"})",
                        "application/json"
                    );

                    return;
                }


                int id = std::stoi(
                    req.get_param_value("id")
                );


                const VectorRecord* record =
                    db.get(id);


                if (record == nullptr) {

                    res.status = 404;

                    res.set_content(
                        R"({"error":"Vector ID not found"})",
                        "application/json"
                    );

                    return;
                }


                std::ostringstream json;

                json << "{";

                json << "\"id\":"
                     << record->id
                     << ",";

                json << "\"text\":\""
                     << record->text
                     << "\",";

                json << "\"source\":\""
                     << record->source
                     << "\",";

                json << "\"page\":"
                     << record->page
                     << ",";

                json << "\"chunk\":"
                     << record->chunk;

                json << "}";


                res.set_content(
                    json.str(),
                    "application/json"
                );

            }
            catch (const std::exception& e) {

                res.status = 400;

                std::ostringstream json;

                json << "{";
                json << "\"error\":\""
                     << e.what()
                     << "\"";
                json << "}";

                res.set_content(
                    json.str(),
                    "application/json"
                );
            }
        }
    );


    // =====================================================
    // POST /search
    //
    // Preferred:
    //
    //   query vector -> request body
    //
    // Metadata:
    //
    //   k
    //   algorithm
    //   metric
    //
    // This avoids URI Too Long (414) errors for 384-D vectors.
    // =====================================================

    server.Post(
        "/search",
        [&](const httplib::Request& req,
            httplib::Response& res) {

            try {

                // -------------------------------------------------
                // Query vector
                //
                // Preferred -> request body
                // Fallback  -> ?query=...
                // -------------------------------------------------

                std::vector<float> query;

                if (!req.body.empty()) {

                    query = parseVector(
                        req.body
                    );

                }
                else if (req.has_param("query")) {

                    query = parseVector(
                        req.get_param_value("query")
                    );

                }
                else {

                    throw std::invalid_argument(
                        "query is required"
                    );
                }


                // -------------------------------------------------
                // k
                // -------------------------------------------------

                int k = 5;

                if (req.has_param("k")) {

                    k = std::stoi(
                        req.get_param_value("k")
                    );
                }


                if (k <= 0) {

                    throw std::invalid_argument(
                        "k must be greater than 0"
                    );
                }


                // -------------------------------------------------
                // Algorithm
                // -------------------------------------------------

                std::string algorithm = "hnsw";

                if (req.has_param("algorithm")) {

                    algorithm =
                        req.get_param_value(
                            "algorithm"
                        );
                }


                // -------------------------------------------------
                // Metric
                // -------------------------------------------------

                std::string metric = "cosine";

                if (req.has_param("metric")) {

                    metric =
                        req.get_param_value(
                            "metric"
                        );
                }


                // -------------------------------------------------
                // Search VectorDB
                // -------------------------------------------------

                auto results =
                    db.search(
                        query,
                        k,
                        algorithm,
                        metric
                    );


                // -------------------------------------------------
                // Build JSON
                // -------------------------------------------------

                std::ostringstream json;

                json << "{";

                json << "\"algorithm\":\""
                     << algorithm
                     << "\",";

                json << "\"metric\":\""
                     << metric
                     << "\",";

                json << "\"results\":[";


                for (
                    size_t i = 0;
                    i < results.size();
                    i++
                ) {

                    if (i > 0) {
                        json << ",";
                    }


                    int id =
                        results[i].second;


                    const VectorRecord* record =
                        db.get(id);


                    json << "{";

                    json << "\"id\":"
                         << id
                         << ",";

                    json << "\"distance\":"
                         << results[i].first;


                    if (record != nullptr) {

                        json << ",\"text\":\""
                             << record->text
                             << "\",";

                        json << "\"source\":\""
                             << record->source
                             << "\",";

                        json << "\"page\":"
                             << record->page
                             << ",";

                        json << "\"chunk\":"
                             << record->chunk;
                    }


                    json << "}";
                }


                json << "]";

                json << "}";


                res.set_content(
                    json.str(),
                    "application/json"
                );

            }
            catch (const std::exception& e) {

                res.status = 400;

                std::ostringstream json;

                json << "{";
                json << "\"error\":\""
                     << e.what()
                     << "\"";
                json << "}";

                res.set_content(
                    json.str(),
                    "application/json"
                );
            }
        }
    );


    // =====================================================
    // GET /search
    //
    // Kept for manual/small-vector testing.
    //
    // Example:
    // /search?query=1,0,0,0&algorithm=hnsw&metric=cosine&k=1
    //
    // For 384-D embeddings, use POST /search instead.
    // =====================================================

    server.Get(
        "/search",
        [&](const httplib::Request& req,
            httplib::Response& res) {

            try {

                if (!req.has_param("query")) {

                    res.status = 400;

                    res.set_content(
                        R"({"error":"query parameter is required"})",
                        "application/json"
                    );

                    return;
                }


                std::vector<float> query =
                    parseVector(
                        req.get_param_value("query")
                    );


                int k = 5;

                if (req.has_param("k")) {

                    k = std::stoi(
                        req.get_param_value("k")
                    );
                }


                if (k <= 0) {

                    throw std::invalid_argument(
                        "k must be greater than 0"
                    );
                }


                std::string algorithm = "hnsw";

                if (req.has_param("algorithm")) {

                    algorithm =
                        req.get_param_value(
                            "algorithm"
                        );
                }


                std::string metric = "cosine";

                if (req.has_param("metric")) {

                    metric =
                        req.get_param_value(
                            "metric"
                        );
                }


                auto results =
                    db.search(
                        query,
                        k,
                        algorithm,
                        metric
                    );


                std::ostringstream json;

                json << "{";

                json << "\"algorithm\":\""
                     << algorithm
                     << "\",";

                json << "\"metric\":\""
                     << metric
                     << "\",";

                json << "\"results\":[";


                for (
                    size_t i = 0;
                    i < results.size();
                    i++
                ) {

                    if (i > 0) {
                        json << ",";
                    }


                    int id =
                        results[i].second;


                    const VectorRecord* record =
                        db.get(id);


                    json << "{";

                    json << "\"id\":"
                         << id
                         << ",";

                    json << "\"distance\":"
                         << results[i].first;


                    if (record != nullptr) {

                        json << ",\"text\":\""
                             << record->text
                             << "\",";

                        json << "\"source\":\""
                             << record->source
                             << "\",";

                        json << "\"page\":"
                             << record->page
                             << ",";

                        json << "\"chunk\":"
                             << record->chunk;
                    }


                    json << "}";
                }


                json << "]";

                json << "}";


                res.set_content(
                    json.str(),
                    "application/json"
                );

            }
            catch (const std::exception& e) {

                res.status = 400;

                std::ostringstream json;

                json << "{";
                json << "\"error\":\""
                     << e.what()
                     << "\"";
                json << "}";

                res.set_content(
                    json.str(),
                    "application/json"
                );
            }
        }
    );


    // =====================================================
    // Start server
    // =====================================================

    std::cout
        << "RecallAI Vector Engine\n"
        << "http://localhost:8081\n";


    server.listen(
        "0.0.0.0",
        8081
    );


    return 0;
}