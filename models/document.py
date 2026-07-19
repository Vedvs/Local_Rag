from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class SourceDocument:
    path: Path
    relative_path: str
    filename: str
    folder: str
    extension: str
    last_modified: str
    text: str
    page_number: int | None = None
    title: str | None = None
    section: str | None = None


@dataclass(frozen=True)
class ChunkRecord:
    chunk_id: str
    text: str
    filename: str
    folder: str
    extension: str
    source_path: str
    relative_path: str
    last_modified: str
    page_number: int | None
    title: str
    section: str
    chunk_index: int
    metadata: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class DocumentChunk(ChunkRecord):
    embedding: list[float] | None = None


@dataclass(frozen=True)
class SearchResult:
    source_path: str
    relative_path: str
    filename: str
    folder: str
    extension: str
    page_number: int | None
    title: str
    section: str
    chunk_index: int
    text: str
    score: float