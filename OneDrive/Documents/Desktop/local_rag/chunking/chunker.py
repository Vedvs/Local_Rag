from __future__ import annotations

import hashlib
import re

from config.settings import CHUNK_OVERLAP, CHUNK_SIZE, EMBEDDING_MODEL_NAME
from models.document import ChunkRecord, SourceDocument

# Lightweight word-boundary tokeniser — avoids importing PyTorch/transformers.
# ~4 chars per token is a standard approximation for English text.
_CHARS_PER_TOKEN = 4


class Chunker:
    def __init__(
        self,
        model_name: str = EMBEDDING_MODEL_NAME,
        chunk_size: int = CHUNK_SIZE,
        overlap: int = CHUNK_OVERLAP,
    ) -> None:
        # chunk_size / overlap are in tokens; convert to approx chars
        self.chunk_chars = chunk_size * _CHARS_PER_TOKEN
        self.overlap_chars = overlap * _CHARS_PER_TOKEN

    def _split_words(self, text: str) -> list[str]:
        """Split text into words preserving whitespace tokens."""
        return re.findall(r"\S+|\s+", text)

    def _chunk_words(self, words: list[str]) -> list[str]:
        """Group words into overlapping chunks of ~chunk_chars characters."""
        chunks: list[str] = []
        step = max(1, self.chunk_chars - self.overlap_chars)
        start_char = 0
        full_text = "".join(words)
        while start_char < len(full_text):
            end_char = start_char + self.chunk_chars
            chunks.append(full_text[start_char:end_char])
            start_char += step
        return chunks

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
        if not document.text or not document.text.strip():
            return []

        words = self._split_words(document.text)
        raw_chunks = self._chunk_words(words)

        chunks: list[ChunkRecord] = []
        section = self._infer_section(document.text) or document.section or document.title or document.filename
        for chunk_index, chunk_text in enumerate(raw_chunks):
            chunk_text = chunk_text.strip()
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