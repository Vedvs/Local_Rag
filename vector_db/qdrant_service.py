from dataclasses import asdict
from functools import lru_cache
from pathlib import Path
import uuid

from qdrant_client import QdrantClient
from qdrant_client.http import models as rest

from config.settings import QDRANT_COLLECTION_NAME, QDRANT_STORAGE_PATH
from models.document import ChunkRecord, SearchResult


class QdrantChunkStore:
    def __init__(self, storage_path: Path | None = None, collection_name: str = QDRANT_COLLECTION_NAME) -> None:
        self.storage_path = storage_path or QDRANT_STORAGE_PATH
        self.collection_name = collection_name
        self.client = QdrantClient(path=str(self.storage_path))

    def ensure_collection(self, vector_size: int) -> None:
        existing = {collection.name for collection in self.client.get_collections().collections}
        if self.collection_name in existing:
            try:
                info = self.client.get_collection(self.collection_name)
                # Extract vector size from VectorParams or dict
                current_size = None
                config = getattr(info, "config", None)
                params = getattr(config, "params", None) if config else None
                vectors = getattr(params, "vectors", None) if params else None
                
                if vectors:
                    if hasattr(vectors, "size"):
                        current_size = vectors.size
                    elif isinstance(vectors, dict) and "size" in vectors:
                        current_size = vectors["size"]
                
                if current_size == vector_size:
                    return
                
                print(f"[Qdrant] Dimension mismatch (existing: {current_size}, new: {vector_size}). Recreating collection.")
                self.client.delete_collection(self.collection_name)
            except Exception as e:
                print(f"[Qdrant] Error checking collection size: {e}. Recreating collection.")
                self.client.delete_collection(self.collection_name)

        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=rest.VectorParams(size=vector_size, distance=rest.Distance.COSINE),
        )

    @staticmethod
    def _point_id(chunk: ChunkRecord) -> str:
        return str(uuid.uuid5(uuid.NAMESPACE_URL, chunk.chunk_id))

    def upsert_chunks(self, chunks: list[ChunkRecord], embeddings: list[list[float]]) -> None:
        if not chunks:
            return

        self.ensure_collection(len(embeddings[0]))
        points = []
        for chunk, embedding in zip(chunks, embeddings, strict=True):
            points.append(
                rest.PointStruct(
                    id=self._point_id(chunk),
                    vector=embedding,
                    payload=asdict(chunk),
                )
            )

        self.client.upsert(collection_name=self.collection_name, points=points)

    def search(self, query_embedding: list[float], limit: int = 10, folder: str | None = None) -> list[SearchResult]:
        query_filter = None
        if folder:
            query_filter = rest.Filter(
                must=[rest.FieldCondition(key="folder", match=rest.MatchValue(value=folder))]
            )

        try:
            self.client.get_collection(self.collection_name)
        except ValueError:
            return []

        response = self.client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            limit=limit,
            with_payload=True,
            query_filter=query_filter,
        )

        results: list[SearchResult] = []
        for match in response.points:
            payload = match.payload or {}
            results.append(
                SearchResult(
                    source_path=str(payload.get("source_path", "")),
                    relative_path=str(payload.get("relative_path", "")),
                    filename=str(payload.get("filename", "")),
                    folder=str(payload.get("folder", "")),
                    extension=str(payload.get("extension", "")),
                    page_number=payload.get("page_number"),
                    title=str(payload.get("title", "")),
                    section=str(payload.get("section", "")),
                    chunk_index=int(payload.get("chunk_index", 0)),
                    text=str(payload.get("text", "")),
                    score=float(match.score or 0.0),
                )
            )
        return results

    def scroll_chunks(self, limit: int = 1000) -> list[ChunkRecord]:
        try:
            self.client.get_collection(self.collection_name)
        except ValueError:
            return []

        chunks: list[ChunkRecord] = []
        offset = None
        while True:
            points, offset = self.client.scroll(
                collection_name=self.collection_name,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=True,
            )

            for point in points:
                payload = point.payload or {}
                chunks.append(
                    ChunkRecord(
                        chunk_id=str(payload.get("chunk_id", point.id)),
                        text=str(payload.get("text", "")),
                        filename=str(payload.get("filename", "")),
                        folder=str(payload.get("folder", "")),
                        extension=str(payload.get("extension", "")),
                        source_path=str(payload.get("source_path", "")),
                        relative_path=str(payload.get("relative_path", "")),
                        last_modified=str(payload.get("last_modified", "")),
                        page_number=payload.get("page_number"),
                        title=str(payload.get("title", "")),
                        section=str(payload.get("section", "")),
                        chunk_index=int(payload.get("chunk_index", 0)),
                        metadata=dict(payload.get("metadata", {}) or {}),
                    )
                )

            if offset is None:
                break

        return chunks


@lru_cache(maxsize=4)
def get_qdrant_store(
    storage_path: Path | None = None,
    collection_name: str = QDRANT_COLLECTION_NAME,
) -> QdrantChunkStore:
    return QdrantChunkStore(storage_path=storage_path, collection_name=collection_name)