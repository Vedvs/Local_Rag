from pathlib import Path

from loaders.base import clean_text, metadata_for
from models.document import SourceDocument


def load_text_documents(path: Path, data_root: Path) -> list[SourceDocument]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    cleaned = clean_text(text)
    if not cleaned:
        return []

    meta = metadata_for(path, data_root)
    return [SourceDocument(text=cleaned, **meta)]