from dataclasses import asdict
from pathlib import Path
import json

from chunking.chunker import Chunker
from config.settings import CHUNK_OVERLAP, CHUNK_SIZE, DATA_ROOT, EMBEDDING_BATCH_SIZE, EMBEDDING_MODEL_NAME, EMBEDDED_CHUNKS_PATH
from embeddings.embedding_service import EmbeddingConfig, EmbeddingService, get_embedding_service
from loaders import discover_documents, load_docx_documents, load_markdown_documents, load_pdf_documents, load_text_documents
from models.document import ChunkRecord, DocumentChunk, SourceDocument
from vector_db.qdrant_service import QdrantChunkStore, get_qdrant_store


def _load_source_documents(data_root: Path) -> list[SourceDocument]:
    documents: list[SourceDocument] = []
    for path in discover_documents(data_root):
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            documents.extend(load_pdf_documents(path, data_root))
        elif suffix in {".md", ".markdown"}:
            documents.extend(load_markdown_documents(path, data_root))
        elif suffix == ".docx":
            documents.extend(load_docx_documents(path, data_root))
        else:
            documents.extend(load_text_documents(path, data_root))
    return documents


def ingest_data_root(
    data_root: Path | None = None,
    model_name: str = EMBEDDING_MODEL_NAME,
    batch_size: int = EMBEDDING_BATCH_SIZE,
    output_path: Path | None = None,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
    qdrant_store: QdrantChunkStore | None = None,
    embedding_service: EmbeddingService | None = None,
) -> list[DocumentChunk]:
    root = data_root or DATA_ROOT
    destination = output_path or EMBEDDED_CHUNKS_PATH

    sources = _load_source_documents(root)
    resolved_chunk_size = chunk_size if chunk_size is not None else CHUNK_SIZE
    resolved_chunk_overlap = chunk_overlap if chunk_overlap is not None else CHUNK_OVERLAP
    chunker = Chunker(model_name=model_name, chunk_size=resolved_chunk_size, overlap=resolved_chunk_overlap)
    chunks: list[ChunkRecord] = []
    for source in sources:
        chunks.extend(chunker.chunk_document(source))

    if not chunks:
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text("", encoding="utf-8")
        return []

    # Reuse the provided service or fall back to the cached singleton to avoid
    # re-downloading the model weights and crashing the HTTP client.
    service = embedding_service or get_embedding_service(model_name=model_name, batch_size=batch_size)
    embeddings = service.embed_documents([chunk.text for chunk in chunks])

    embedded_chunks = [
        DocumentChunk(**asdict(chunk), embedding=embedding)
        for chunk, embedding in zip(chunks, embeddings, strict=True)
    ]

    # Reuse the provided store or fall back to the cached singleton to avoid
    # opening a second local Qdrant client on the same storage folder (which
    # would raise a portalocker.AlreadyLocked error on Windows).
    store = qdrant_store or get_qdrant_store()
    store.upsert_chunks(chunks, embeddings)

    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8") as handle:
        for chunk in embedded_chunks:
            handle.write(json.dumps(asdict(chunk), ensure_ascii=True))
            handle.write("\n")

    return embedded_chunks