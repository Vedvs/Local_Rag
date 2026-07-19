# ── base image: slim Python 3.11 ─────────────────────────────────────────────
FROM python:3.11-slim

# System dependencies needed by PyMuPDF and fastembed ONNX runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

# ── working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── install Python dependencies (cached layer) ────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── pre-download the ONNX embedding model into the image ─────────────────────
# fastembed uses ONNX Runtime — no PyTorch or CUDA required.
# Model is ~65 MB total and is cached at build time so no network needed at runtime.
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5')"

# ── copy application source ───────────────────────────────────────────────────
COPY . .

# ── create required directories ───────────────────────────────────────────────
RUN mkdir -p vector_db/qdrant data/pdfs data/markdown data/text

# ── environment ───────────────────────────────────────────────────────────────
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# ── expose port ───────────────────────────────────────────────────────────────
EXPOSE 8000

# ── startup: ingest docs then serve ───────────────────────────────────────────
CMD ["sh", "-c", "python startup.py; python -m uvicorn main:app --host 0.0.0.0 --port $PORT"]
