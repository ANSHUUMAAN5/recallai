# Build context is the repo root (see docker-compose.yml) because this
# image needs api/, ingestion/, and rag/ together.

FROM python:3.11-slim

WORKDIR /app

COPY api/requirements.txt ./requirements.txt

# Install the CPU-only torch wheel first, with --index-url fully replacing
# the default index for this command — --extra-index-url would leave pip
# free to resolve the much larger CUDA-enabled wheel from PyPI instead.
RUN pip install --no-cache-dir torch==2.13.0 \
    --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

COPY api/ ./api/
COPY ingestion/ ./ingestion/
COPY rag/ ./rag/

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
