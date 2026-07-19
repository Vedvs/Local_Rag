from __future__ import annotations

import hashlib

from transformers import AutoTokenizer

from config.settings import CHUNK_OVERLAP, CHUNK_SIZE, EMBEDDING_MODEL_NAME
from models.document import ChunkRecord, SourceDocument


class Chunker:
    def __init__(
        self,
        model_name: str = EMBEDDING_MODEL_NAME,
        chunk_size: int = CHUNK_SIZE,
        overlap: int = CHUNK_OVERLAP,
    ) -> None:
        self.tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
        self.chunk_size = chunk_size
        self.overlap = overlap

    def _chunk_token_ids(self, token_ids: list[int]) -> list[list[int]]:
        step = max(1, self.chunk_size - self.overlap)
        return [token_ids[start : start + self.chunk_size] for start in range(0, len(token_ids), step)]

    @staticmethod
    def _infer_section(text: str) -> str:
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("#"):
                return stripped.lstrip("#").strip()
        return ""

    @staticmethod
    def _chunk_id(source_path: str, chunk_index: int, text: str) -> str:
        return hashlib.sha1(f"{source_path}:{chunk_index}:{text}".encode("utf-8")).hexdigest()

    def chunk_document(self, document: SourceDocument) -> list[ChunkRecord]:
        token_ids = self.tokenizer.encode(document.text, add_special_tokens=False)
        if not token_ids:
            return []

        chunks: list[ChunkRecord] = []
        section = self._infer_section(document.text) or document.section or document.title or document.filename
        for chunk_index, chunk_tokens in enumerate(self._chunk_token_ids(token_ids)):
            chunk_text = self.tokenizer.decode(chunk_tokens, skip_special_tokens=True).strip()
            if not chunk_text:
                continue

            chunks.append(
                ChunkRecord(
                    chunk_id=self._chunk_id(str(document.path), chunk_index, chunk_text),
                    text=chunk_text,
                    filename=document.filename,
                    folder=document.folder,
                    extension=document.extension,
                    source_path=str(document.path),
                    relative_path=document.relative_path,
                    last_modified=document.last_modified,
                    page_number=document.page_number,
                    title=document.title or document.filename,
                    section=section,
                    chunk_index=chunk_index,
                    metadata={
                        "filename": document.filename,
                        "folder": document.folder,
                        "extension": document.extension,
                        "path": str(document.path),
                        "last_modified": document.last_modified,
                    },
                )
            )

        return chunks