from pathlib import Path

from config.settings import CHUNK_OVERLAP, CHUNK_SIZE, EMBEDDING_BATCH_SIZE, EMBEDDING_MODEL_NAME
from ingestion.ingest import ingest_data_root
from models.document import DocumentChunk


def build_embeddings_from_data_root(
	data_root: Path | None = None,
	output_path: Path | None = None,
	model_name: str = EMBEDDING_MODEL_NAME,
	batch_size: int = EMBEDDING_BATCH_SIZE,
	chunk_size: int = CHUNK_SIZE,
	chunk_overlap: int = CHUNK_OVERLAP,
) -> list[DocumentChunk]:
	return ingest_data_root(
		data_root=data_root,
		model_name=model_name,
		batch_size=batch_size,
		output_path=output_path,
		chunk_size=chunk_size,
		chunk_overlap=chunk_overlap,
	)