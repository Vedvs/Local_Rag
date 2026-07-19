"""
startup.py — runs once on container boot before uvicorn starts.

On Render's free tier (512MB RAM, ephemeral disk) we skip automatic ingestion
at startup to avoid OOM errors from embedding large document batches.
Documents can be re-ingested via the /api/ingest endpoint after the server is live.

If you have a persistent disk attached, set the environment variable
AUTO_INGEST=true to enable automatic ingestion on boot.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

def main():
    auto_ingest = os.environ.get("AUTO_INGEST", "false").lower() == "true"
    if not auto_ingest:
        print("[startup] AUTO_INGEST not set — skipping ingestion. Server will start immediately.")
        print("[startup] Use the /api/ingest endpoint to index your documents after the server is live.")
        return

    from vector_db.qdrant_service import get_qdrant_store
    from config.settings import QDRANT_COLLECTION_NAME

    print("[startup] Checking vector database...")
    store = get_qdrant_store()

    try:
        info = store.client.get_collection(QDRANT_COLLECTION_NAME)
        count = info.points_count or 0
    except Exception:
        count = 0

    if count > 0:
        print(f"[startup] Qdrant already has {count} chunks — skipping ingestion.")
        return

    print("[startup] No chunks found — running ingestion...")
    from ingestion.ingest import ingest_data_root
    chunks = ingest_data_root(qdrant_store=store)
    docs = len({c.relative_path for c in chunks})
    print(f"[startup] Done. Indexed {docs} documents, {len(chunks)} chunks.")

if __name__ == "__main__":
    main()
