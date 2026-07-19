from models.document import SearchResult


def build_prompt(question: str, chunks: list[SearchResult]) -> str:
    context = "\n\n".join(
        f"[{chunk.filename} | page={chunk.page_number or 'n/a'} | section={chunk.section or 'n/a'}]\n{chunk.text}"
        for chunk in chunks
    )
    return f"""You are an assistant.

Answer ONLY using the context below.

If the answer isn't present, say you don't know.

Context:
---------
{context}
---------

Question:
{question}
"""