from dataclasses import dataclass
from functools import lru_cache
from typing import Sequence

from fastembed import TextEmbedding


@dataclass(frozen=True)
class EmbeddingConfig:
    model_name: str = "BAAI/bge-small-en-v1.5"
    batch_size: int = 32
    normalize_embeddings: bool = True


class EmbeddingService:
    query_prefix = "Represent this question for searching relevant passages: "

    def __init__(self, config: EmbeddingConfig | None = None, device: str | None = None) -> None:
        self.config = config or EmbeddingConfig()
        self.model = TextEmbedding(self.config.model_name, threads=1)

    def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        cleaned_texts = [text.strip() for text in texts if text and text.strip()]
        if not cleaned_texts:
            return []
        return [emb.tolist() for emb in self.model.embed(cleaned_texts)]

    def embed_query(self, query: str) -> list[float]:
        prefixed = f"{self.query_prefix}{query.strip()}"
        return next(self.model.query_embed([prefixed])).tolist()


@lru_cache(maxsize=8)
def get_embedding_service(
    model_name: str = "BAAI/bge-small-en-v1.5",
    batch_size: int = 32,
    normalize_embeddings: bool = True,
    device: str | None = None,
) -> EmbeddingService:
    return EmbeddingService(
        EmbeddingConfig(
            model_name=model_name,
            batch_size=batch_size,
            normalize_embeddings=normalize_embeddings,
        ),
        device=device,
    )
