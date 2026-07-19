"""
startup.py — runs once on container boot before uvicorn starts.
Ingests any documents in the data/ directory into Qdrant.
If Qdrant already has data (persistent disk), ingestion is skipped.
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from vector_db.qdrant_service import get_qdrant_store
from config.settings import QDRANT_COLLECTION_NAME

def main():
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
