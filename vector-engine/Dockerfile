# =============================================================
# Build stage
# =============================================================
FROM debian:bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY CMakeLists.txt .
COPY include/ include/
COPY src/ src/

RUN cmake -S . -B build -DBUILD_TESTS=OFF -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build -j

# =============================================================
# Runtime stage
# =============================================================
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /src/build/recallai-engine .

RUN mkdir -p data

EXPOSE 8081

CMD ["./recallai-engine"]
