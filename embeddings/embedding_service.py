from dataclasses import dataclass
from functools import lru_cache
from typing import Sequence

from sentence_transformers import SentenceTransformer


@dataclass(frozen=True)
class EmbeddingConfig:
    model_name: str = "BAAI/bge-large-en-v1.5"
    batch_size: int = 32
    normalize_embeddings: bool = True


class EmbeddingService:
    query_prefix = "Represent this question for searching relevant passages: "

    def __init__(self, config: EmbeddingConfig | None = None, device: str | None = None) -> None:
        self.config = config or EmbeddingConfig()
        self.model = SentenceTransformer(self.config.model_name, device=device)

    def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        cleaned_texts = [text.strip() for text in texts if text and text.strip()]
        if not cleaned_texts:
            return []

        embeddings = self.model.encode(
            cleaned_texts,
            batch_size=self.config.batch_size,
            normalize_embeddings=self.config.normalize_embeddings,
            show_progress_bar=False,
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> list[float]:
        embedding = self.model.encode(
            [f"{self.query_prefix}{query.strip()}"],
            batch_size=1,
            normalize_embeddings=self.config.normalize_embeddings,
            show_progress_bar=False,
        )[0]
        return embedding.tolist()


@lru_cache(maxsize=8)
def get_embedding_service(
    model_name: str = "BAAI/bge-large-en-v1.5",
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