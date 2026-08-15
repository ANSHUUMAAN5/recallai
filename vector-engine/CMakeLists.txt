cmake_minimum_required(VERSION 3.16)
project(recallai_engine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()
set(CMAKE_CXX_FLAGS_RELEASE "-O2")

option(BUILD_TESTS "Build vector-engine test executables" ON)

find_package(Threads REQUIRED)

add_library(recallai_core
    src/distance.cpp
    src/brute_force.cpp
    src/kd_tree.cpp
    src/hnsw.cpp
    src/vector_db.cpp
    src/persistence.cpp
)

target_include_directories(recallai_core PUBLIC include)
target_link_libraries(recallai_core PUBLIC Threads::Threads)

add_executable(recallai-engine src/server.cpp)
target_link_libraries(recallai-engine PRIVATE recallai_core)

if(BUILD_TESTS)
    add_executable(test_brute src/test_brute.cpp)
    target_link_libraries(test_brute PRIVATE recallai_core)

    add_executable(test_hnsw src/test_hnsw.cpp)
    target_link_libraries(test_hnsw PRIVATE recallai_core)

    add_executable(test_vector_db src/test_vector_db.cpp)
    target_link_libraries(test_vector_db PRIVATE recallai_core)
endif()
