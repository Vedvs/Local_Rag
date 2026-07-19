from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = PROJECT_ROOT / "data"
VECTOR_DB_DIR = PROJECT_ROOT / "vector_db"
QDRANT_STORAGE_PATH = VECTOR_DB_DIR / "qdrant"
QDRANT_COLLECTION_NAME = "local_rag_chunks"

EMBEDDING_MODEL_NAME = "BAAI/bge-large-en-v1.5"
EMBEDDING_BATCH_SIZE = 32
CHUNK_SIZE = 750
CHUNK_OVERLAP = 100
GROQ_MODEL_NAME = "openai/gpt-oss-120b"
OLLAMA_MODEL_NAME = GROQ_MODEL_NAME

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown", ".docx"}

EMBEDDED_CHUNKS_PATH = VECTOR_DB_DIR / "embedded_chunks.jsonl"