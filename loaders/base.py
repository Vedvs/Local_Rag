from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import re

from config.settings import SUPPORTED_EXTENSIONS


def discover_documents(data_root: Path) -> list[Path]:
    return sorted(
        path
        for path in data_root.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def modified_timestamp(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()


def metadata_for(path: Path, data_root: Path, page_number: int | None = None) -> dict[str, object]:
    return {
        "path": str(path),
        "relative_path": str(path.relative_to(data_root)),
        "filename": path.name,
        "folder": str(path.parent.relative_to(data_root)),
        "extension": path.suffix.lower(),
        "last_modified": modified_timestamp(path),
        "page_number": page_number,
        "title": path.stem,
    }


def clean_text(text: str) -> str:
    lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            lines.append("")
            continue
        if re.fullmatch(r"\d+", line):
            continue
        if re.fullmatch(r"page\s+\d+(\s+of\s+\d+)?", line, flags=re.IGNORECASE):
            continue
        lines.append(line)

    cleaned = "\n".join(lines)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()