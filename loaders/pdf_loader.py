from collections import Counter
from pathlib import Path

import fitz

from loaders.base import clean_text, metadata_for
from models.document import SourceDocument


def _drop_repeated_edges(page_texts: list[str]) -> list[str]:
    first_lines = []
    last_lines = []
    for text in page_texts:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if lines:
            first_lines.append(lines[0])
            last_lines.append(lines[-1])

    repeated = {line for line, count in Counter(first_lines + last_lines).items() if count > 1}
    cleaned_pages = []
    for text in page_texts:
        lines = [line for line in text.splitlines() if line.strip() and line.strip() not in repeated]
        cleaned_pages.append("\n".join(lines))
    return cleaned_pages


def load_pdf_documents(path: Path, data_root: Path) -> list[SourceDocument]:
    raw_pages: list[str] = []
    with fitz.open(path) as pdf:
        for page in pdf:
            raw_pages.append(page.get_text("text"))

    filtered_pages = _drop_repeated_edges(raw_pages)
    documents: list[SourceDocument] = []
    for page_number, page_text in enumerate(filtered_pages, start=1):
        cleaned = clean_text(page_text)
        if not cleaned:
            continue

        meta = metadata_for(path, data_root, page_number=page_number)
        documents.append(SourceDocument(text=cleaned, **meta))

    return documents