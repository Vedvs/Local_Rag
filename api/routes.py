from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sklearn.decomposition import PCA
import json

from config.settings import CHUNK_OVERLAP, CHUNK_SIZE, DATA_ROOT, EMBEDDING_MODEL_NAME, OLLAMA_MODEL_NAME
from embeddings.embedding_service import get_embedding_service
from ingestion.ingest import ingest_data_root
from llm.ollama_service import OllamaConfig, OllamaService
from prompts.prompt_builder import build_prompt
from retrieval.retriever import Retriever
from vector_db.qdrant_service import get_qdrant_store


app = FastAPI(title="Local RAG", version="2.0.0")


@app.on_event("startup")
def startup_event():
    # Auto-ingestion is disabled to prevent OOM crashes on Render's free tier (512MB).
    # The background thread was embedding all PDFs at once which exceeded memory limits.
    # Use the POST /api/ingest endpoint to trigger ingestion manually after the server is live.
    print("[startup] Server ready. Use POST /api/ingest to index your documents.")


CHAT_PAGE = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Local RAG Chat</title>
    <style>
        :root {
            color-scheme: dark;
            --bg: #08111f;
            --bg2: #0f1d33;
            --panel: rgba(10, 18, 31, 0.88);
            --panel-border: rgba(148, 163, 184, 0.18);
            --text: #e5eefc;
            --muted: #9fb1cc;
            --accent: #5eead4;
            --accent-2: #60a5fa;
            --danger: #fb7185;
            --shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
        }

        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Segoe UI", "Trebuchet MS", sans-serif;
            color: var(--text);
            background:
                radial-gradient(circle at top left, rgba(96, 165, 250, 0.22), transparent 34%),
                radial-gradient(circle at bottom right, rgba(94, 234, 212, 0.18), transparent 28%),
                linear-gradient(160deg, var(--bg), var(--bg2));
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .shell {
            width: min(1100px, 100%);
            display: grid;
            gap: 18px;
            grid-template-columns: 1.15fr 0.85fr;
        }

        .hero, .panel {
            border: 1px solid var(--panel-border);
            background: var(--panel);
            backdrop-filter: blur(14px);
            box-shadow: var(--shadow);
            border-radius: 24px;
        }

        .hero {
            padding: 28px;
            position: relative;
            overflow: hidden;
        }

        .hero::after {
            content: "";
            position: absolute;
            inset: auto -40px -60px auto;
            width: 220px;
            height: 220px;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(94, 234, 212, 0.22), transparent 68%);
            pointer-events: none;
        }

        .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(96, 165, 250, 0.12);
            color: #cce1ff;
            font-size: 13px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }

        h1 {
            margin: 16px 0 10px;
            font-size: clamp(2rem, 5vw, 4rem);
            line-height: 0.95;
            letter-spacing: -0.04em;
        }

        .lead {
            margin: 0;
            max-width: 62ch;
            color: var(--muted);
            font-size: 1rem;
            line-height: 1.6;
        }

        .chips {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 18px;
        }

        .chip {
            padding: 8px 12px;
            border-radius: 999px;
            border: 1px solid rgba(148, 163, 184, 0.22);
            background: rgba(15, 23, 42, 0.65);
            color: #d7e6ff;
            font-size: 13px;
        }

        .panel {
            padding: 18px;
        }

        .panel-header {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
            margin-bottom: 12px;
        }

        .panel-header h2 {
            margin: 0;
            font-size: 1.1rem;
        }

        .status {
            color: var(--muted);
            font-size: 13px;
        }

        .chat-log {
            min-height: 340px;
            max-height: 52vh;
            overflow: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 8px 4px 14px;
            margin-bottom: 12px;
        }

        .message {
            max-width: 92%;
            padding: 14px 16px;
            border-radius: 18px;
            line-height: 1.55;
            white-space: pre-wrap;
            word-break: break-word;
            border: 1px solid rgba(148, 163, 184, 0.16);
        }

        .message.user {
            align-self: flex-end;
            background: linear-gradient(135deg, rgba(96, 165, 250, 0.25), rgba(37, 99, 235, 0.18));
        }

        .message.assistant {
            align-self: flex-start;
            background: rgba(15, 23, 42, 0.75);
        }

        .message.error {
            align-self: flex-start;
            background: rgba(190, 24, 93, 0.12);
            border-color: rgba(251, 113, 133, 0.35);
            color: #ffd6de;
        }

        .composer {
            display: grid;
            gap: 10px;
        }

        textarea {
            width: 100%;
            min-height: 110px;
            resize: vertical;
            border-radius: 18px;
            border: 1px solid rgba(148, 163, 184, 0.22);
            background: rgba(2, 6, 23, 0.65);
            color: var(--text);
            padding: 14px 16px;
            font: inherit;
            outline: none;
        }

        textarea:focus {
            border-color: rgba(94, 234, 212, 0.55);
            box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.12);
        }

        .actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }

        button {
            border: 0;
            border-radius: 14px;
            padding: 12px 16px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.15s ease, opacity 0.15s ease;
        }

        button:hover { transform: translateY(-1px); }

        .primary {
            background: linear-gradient(135deg, var(--accent), var(--accent-2));
            color: #06101f;
        }

        .secondary {
            background: rgba(148, 163, 184, 0.12);
            color: var(--text);
        }

        .meta {
            color: var(--muted);
            font-size: 12px;
        }

        details {
            margin-top: 12px;
            border-top: 1px solid rgba(148, 163, 184, 0.14);
            padding-top: 12px;
        }

        summary {
            cursor: pointer;
            color: #d7e6ff;
            font-weight: 600;
        }

        .sources {
            display: grid;
            gap: 10px;
            margin-top: 12px;
        }

        .source {
            padding: 12px 14px;
            border-radius: 16px;
            background: rgba(15, 23, 42, 0.76);
            border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .source-title {
            font-weight: 700;
            margin-bottom: 6px;
            color: #f1f7ff;
        }

        .source-text {
            color: #c8d7ef;
            white-space: pre-wrap;
            line-height: 1.5;
        }

        @media (max-width: 900px) {
            .shell { grid-template-columns: 1fr; }
            .chat-log { max-height: none; min-height: 280px; }
        }
    </style>
</head>
<body>
    <div class="shell">
        <section class="hero">
            <div class="eyebrow">Local RAG Chat</div>
            <h1>Ask your documents a question.</h1>
            <p class="lead">
                Type a query, hit send, and the app will retrieve the most relevant chunks from Qdrant,
                build a grounded prompt, and generate an answer with Ollama.
            </p>
            <div class="chips">
                <span class="chip">BGE embeddings</span>
                <span class="chip">Qdrant search</span>
                <span class="chip">Ollama generation</span>
                <span class="chip">Folder-aware filters</span>
            </div>
        </section>

        <section class="panel">
            <div class="panel-header">
                <h2>Chat</h2>
                <div class="status" id="status">Ready</div>
            </div>

            <div class="chat-log" id="chatLog">
                <div class="message assistant">Ask something like: “Explain gradient boosting” or “What are the key points in the Python notes?”</div>
            </div>

            <form class="composer" id="chatForm">
                <textarea id="query" name="query" placeholder="Type your question here..."></textarea>
                <div class="actions">
                    <button class="primary" type="submit">Send</button>
                    <button class="secondary" type="button" id="clearBtn">Clear</button>
                </div>
                <div class="meta">This uses the existing <code>/ask</code> endpoint.</div>
            </form>

            <details id="sourcesSection" hidden>
                <summary>Retrieved sources</summary>
                <div class="sources" id="sources"></div>
            </details>
        </section>
    </div>

    <script>
        const chatForm = document.getElementById('chatForm');
        const queryInput = document.getElementById('query');
        const chatLog = document.getElementById('chatLog');
        const statusEl = document.getElementById('status');
        const clearBtn = document.getElementById('clearBtn');
        const sourcesSection = document.getElementById('sourcesSection');
        const sourcesEl = document.getElementById('sources');

        const appendMessage = (text, kind) => {
            const message = document.createElement('div');
            message.className = `message ${kind}`;
            message.textContent = text;
            chatLog.appendChild(message);
            chatLog.scrollTop = chatLog.scrollHeight;
            return message;
        };

        const renderSources = (matches) => {
            if (!matches || !matches.length) {
                sourcesSection.hidden = true;
                sourcesEl.innerHTML = '';
                return;
            }

            sourcesEl.innerHTML = matches.map((match) => `
                <div class="source">
                    <div class="source-title">${match.filename || 'Source'} · score ${Number(match.score || 0).toFixed(3)}</div>
                    <div class="meta">${match.relative_path || ''}${match.page_number ? ` · page ${match.page_number}` : ''}${match.section ? ` · ${match.section}` : ''}</div>
                    <div class="source-text">${match.text || ''}</div>
                </div>
            `).join('');
            sourcesSection.hidden = false;
        };

        chatForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const query = queryInput.value.trim();
            if (!query) return;

            appendMessage(query, 'user');
            queryInput.value = '';
            statusEl.textContent = 'Thinking...';

            try {
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, limit: 5 })
                });

                if (!response.ok) {
                    const bodyText = await response.text();
                    throw new Error(bodyText || `Request failed with ${response.status}`);
                }

                const data = await response.json();
                appendMessage(data.answer || 'No answer returned.', 'assistant');
                renderSources(data.matches || []);
                statusEl.textContent = `Done · ${data.matches ? data.matches.length : 0} chunks retrieved`;
            } catch (error) {
                appendMessage(`Error: ${error.message}`, 'error');
                statusEl.textContent = 'Request failed';
            }
        });

        clearBtn.addEventListener('click', () => {
            chatLog.innerHTML = '<div class="message assistant">Ask something like: “Explain gradient boosting” or “What are the key points in the Python notes?”</div>';
            sourcesSection.hidden = true;
            sourcesEl.innerHTML = '';
            statusEl.textContent = 'Ready';
            queryInput.focus();
        });
    </script>
</body>
</html>"""


VISUALIZATION_PAGE = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Embedding Visualization</title>
    <style>
        body { margin: 0; font-family: Segoe UI, Arial, sans-serif; background: #08111f; color: #e5eefc; }
        .wrap { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .card { background: rgba(10,18,31,0.9); border: 1px solid rgba(148,163,184,0.18); border-radius: 20px; padding: 18px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
        h1 { margin: 0 0 8px; }
        .muted { color: #9fb1cc; }
        .toolbar { display:flex; gap: 12px; flex-wrap: wrap; margin: 14px 0; align-items: center; }
        .toolbar button { border:0; border-radius: 12px; padding: 10px 14px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #5eead4, #60a5fa); color:#06101f; }
        .toolbar select { background:#0f1d33; color:#e5eefc; border:1px solid rgba(148,163,184,.22); border-radius: 12px; padding: 10px 12px; }
        canvas { width: 100%; height: 72vh; background: radial-gradient(circle at top left, rgba(96,165,250,.08), transparent 30%), rgba(2,6,23,.65); border-radius: 18px; display:block; border: 1px solid rgba(148,163,184,.16); }
        .legend { display:flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; color:#c8d7ef; font-size: 14px; }
        .dot { width: 12px; height: 12px; border-radius: 999px; display:inline-block; margin-right: 6px; vertical-align: middle; }
        .tooltip { position: fixed; pointer-events: none; display:none; max-width: 320px; background: rgba(15,23,42,.96); border: 1px solid rgba(148,163,184,.2); border-radius: 14px; padding: 10px 12px; box-shadow: 0 24px 80px rgba(0,0,0,.35); z-index: 10; }
        .tooltip strong { display:block; margin-bottom: 4px; }
        .empty { padding: 22px; border: 1px dashed rgba(148,163,184,.3); border-radius: 16px; color:#9fb1cc; }
        a { color: #9dd8ff; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <h1>Embedding Visualization</h1>
            <div class="muted">2D PCA projection of the vectors stored in Qdrant. Points are colored by source folder.</div>
            <div class="toolbar">
                <button id="reloadBtn">Reload data</button>
                <select id="folderFilter"><option value="__all__">All folders</option></select>
                <div class="muted" id="countLabel">Loading...</div>
            </div>
            <canvas id="plot" width="1400" height="900"></canvas>
            <div class="legend" id="legend"></div>
            <div id="emptyState" class="empty" style="display:none; margin-top: 14px;">No embeddings found yet. Run <a href="/">/ingest</a> first, then come back here.</div>
        </div>
    </div>
    <div class="tooltip" id="tooltip"></div>
    <script>
        const canvas = document.getElementById('plot');
        const ctx = canvas.getContext('2d');
        const tooltip = document.getElementById('tooltip');
        const folderFilter = document.getElementById('folderFilter');
        const countLabel = document.getElementById('countLabel');
        const legend = document.getElementById('legend');
        const emptyState = document.getElementById('emptyState');
        const reloadBtn = document.getElementById('reloadBtn');
        let dataset = [];
        let points = [];

        const palette = ['#5eead4','#60a5fa','#f472b6','#f59e0b','#a78bfa','#34d399','#fb7185','#22d3ee','#eab308','#8b5cf6'];

        async function loadData() {
            countLabel.textContent = 'Loading...';
            const res = await fetch('/api/embeddings');
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            dataset = data.points || [];
            const folders = [...new Set(dataset.map(p => p.folder || ''))].filter(Boolean).sort();
            folderFilter.innerHTML = '<option value="__all__">All folders</option>' + folders.map(f => `<option value="${f}">${f}</option>`).join('');
            render();
        }

        function render() {
            const selectedFolder = folderFilter.value;
            const filtered = selectedFolder === '__all__' ? dataset : dataset.filter(p => p.folder === selectedFolder);
            points = filtered;
            countLabel.textContent = `${filtered.length} points shown`;
            emptyState.style.display = filtered.length ? 'none' : 'block';
            legend.innerHTML = '';
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!filtered.length) return;

            const xs = filtered.map(p => p.x), ys = filtered.map(p => p.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
            const pad = 60;
            const scaleX = (x) => pad + (x - minX) / ((maxX - minX) || 1) * (canvas.width - pad * 2);
            const scaleY = (y) => canvas.height - pad - (y - minY) / ((maxY - minY) || 1) * (canvas.height - pad * 2);

            const folders = [...new Set(filtered.map(p => p.folder || ''))].sort();
            const colorMap = new Map(folders.map((f, i) => [f, palette[i % palette.length]]));
            legend.innerHTML = folders.map(f => `<span><span class="dot" style="background:${colorMap.get(f)}"></span>${f}</span>`).join('');

            ctx.strokeStyle = 'rgba(148,163,184,0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad, canvas.height - pad);
            ctx.lineTo(canvas.width - pad, canvas.height - pad);
            ctx.moveTo(pad, pad);
            ctx.lineTo(pad, canvas.height - pad);
            ctx.stroke();

            for (const p of filtered) {
                const x = scaleX(p.x), y = scaleY(p.y);
                p._cx = x; p._cy = y;
                ctx.fillStyle = colorMap.get(p.folder || '') || '#60a5fa';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * (canvas.width / rect.width);
            const y = (event.clientY - rect.top) * (canvas.height / rect.height);
            const hit = points.find(p => Math.hypot(p._cx - x, p._cy - y) < 10);
            if (!hit) { tooltip.style.display = 'none'; return; }
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX + 12}px`;
            tooltip.style.top = `${event.clientY + 12}px`;
            tooltip.innerHTML = `<strong>${hit.filename}</strong><div class="muted">${hit.folder || 'root'}${hit.page_number ? ' · page ' + hit.page_number : ''}</div><div style="margin-top:6px; color:#c8d7ef;">${(hit.text || '').slice(0, 220)}</div>`;
        });
        canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
        folderFilter.addEventListener('change', render);
        reloadBtn.addEventListener('click', loadData);
        loadData().catch(err => { countLabel.textContent = 'Failed to load embeddings'; emptyState.style.display = 'block'; emptyState.textContent = err.message; });
    </script>
</body>
</html>"""


class IngestRequest(BaseModel):
    data_root: Path | None = None
    model_name: str = Field(default=EMBEDDING_MODEL_NAME)
    chunk_size: int = Field(default=CHUNK_SIZE, ge=100, le=4000)
    chunk_overlap: int = Field(default=CHUNK_OVERLAP, ge=0, le=1000)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    limit: int = Field(default=10, ge=1, le=25)
    folder: str | None = None
    model_name: str = Field(default=EMBEDDING_MODEL_NAME)


class AskRequest(BaseModel):
    query: str = Field(min_length=1)
    limit: int = Field(default=5, ge=1, le=20)
    folder: str | None = None
    embedding_model_name: str = Field(default=EMBEDDING_MODEL_NAME)
    ollama_model_name: str = Field(default=OLLAMA_MODEL_NAME)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def home() -> str:
    return CHAT_PAGE


@app.get("/visualize", response_class=HTMLResponse)
def visualize() -> str:
    return VISUALIZATION_PAGE


@app.get("/api/embeddings")
def embeddings_api() -> dict[str, object]:
    store = get_qdrant_store()
    chunks = store.scroll_chunks()
    if not chunks:
        return {"points": []}

    vectors = []
    metadata = []
    for chunk in chunks:
        # The vector is not stored in the payload, so reuse the existing JSONL backup if needed.
        vectors.append(chunk)
        metadata.append(chunk)

    # Rebuild vectors from the local JSONL file if present; Qdrant local scroll keeps payload only.
    jsonl_path = Path("vector_db/embedded_chunks.jsonl")
    if not jsonl_path.exists():
        return {"points": []}

    raw_chunks = []
    with jsonl_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                raw_chunks.append(json.loads(line))

    if not raw_chunks:
        return {"points": []}

    vectors = [chunk.get("embedding", []) for chunk in raw_chunks]
    labels = [
        {
            "filename": chunk.get("filename", ""),
            "folder": chunk.get("folder", ""),
            "relative_path": chunk.get("relative_path", ""),
            "page_number": chunk.get("page_number"),
            "section": chunk.get("section", ""),
            "text": chunk.get("text", ""),
        }
        for chunk in raw_chunks
    ]

    if len(vectors) == 1:
        projected = [[0.0, 0.0]]
    else:
        projected = PCA(n_components=2).fit_transform(vectors).tolist()

    points = [dict(label, x=float(x), y=float(y)) for label, (x, y) in zip(labels, projected, strict=False)]
    return {"points": points}


@app.post("/ingest")
def ingest(request: IngestRequest) -> dict[str, object]:
    chunks = ingest_data_root(
        data_root=request.data_root or DATA_ROOT,
        model_name=request.model_name,
        chunk_size=request.chunk_size,
        chunk_overlap=request.chunk_overlap,
        qdrant_store=get_qdrant_store(),
        embedding_service=get_embedding_service(model_name=request.model_name),
    )
    return {
        "status": "completed",
        "model_name": request.model_name,
        "documents_indexed": len({chunk.relative_path for chunk in chunks}),
        "chunks_created": len(chunks),
    }


@app.post("/search")
def search(request: SearchRequest) -> dict[str, object]:
    retriever = Retriever(model_name=request.model_name)
    matches = retriever.search(request.query, limit=request.limit, folder=request.folder)
    return {
        "query": request.query,
        "matches": [
            {
                "source_path": match.source_path,
                "relative_path": match.relative_path,
                "filename": match.filename,
                "folder": match.folder,
                "extension": match.extension,
                "page_number": match.page_number,
                "title": match.title,
                "section": match.section,
                "chunk_index": match.chunk_index,
                "score": match.score,
                "text": match.text,
            }
            for match in matches
        ],
    }


@app.post("/ask")
def ask(request: AskRequest) -> dict[str, object]:
    retriever = Retriever(model_name=request.embedding_model_name)
    matches = retriever.search(request.query, limit=request.limit, folder=request.folder)
    prompt = build_prompt(request.query, matches)
    answer = OllamaService(OllamaConfig(model_name=request.ollama_model_name)).generate(prompt)
    return {
        "query": request.query,
        "answer": answer,
        "matches": [
            {
                "source_path": match.source_path,
                "relative_path": match.relative_path,
                "filename": match.filename,
                "folder": match.folder,
                "extension": match.extension,
                "page_number": match.page_number,
                "title": match.title,
                "section": match.section,
                "chunk_index": match.chunk_index,
                "score": match.score,
                "text": match.text,
            }
            for match in matches
        ],
    }