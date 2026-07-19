from .base import discover_documents
from .docx_loader import load_docx_documents
from .markdown_loader import load_markdown_documents
from .pdf_loader import load_pdf_documents
from .txt_loader import load_text_documents

__all__ = [
    "discover_documents",
    "load_docx_documents",
    "load_markdown_documents",
    "load_pdf_documents",
    "load_text_documents",
]