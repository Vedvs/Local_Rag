from config.settings import EMBEDDING_MODEL_NAME
from embeddings.embedding_service import get_embedding_service
from models.document import SearchResult
from vector_db.qdrant_service import get_qdrant_store


class Retriever:
    def __init__(
        self,
        model_name: str = EMBEDDING_MODEL_NAME,
        qdrant_store=None,
    ) -> None:
        self.embedding_service = get_embedding_service(model_name=model_name)
        self.qdrant_store = qdrant_store or get_qdrant_store()

    def search(self, query: str, limit: int = 10, folder: str | None = None) -> list[SearchResult]:
        query_embedding = self.embedding_service.embed_query(query)
        return self.qdrant_store.search(query_embedding, limit=limit, folder=folder)