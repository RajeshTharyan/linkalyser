# Linkalyser

A Streamlit app that takes one web page, follows every link on it, and searches the linked **HTML, PDF, Word, and Excel** files for your keywords.

Built to show a small, end-to-end Python tool: fetch pages concurrently, parse several document types, and report matches in a browser UI.

![Linkalyser UI with How to use sidebar](docs/images/linkalyser-ui.png)

## What this repo is meant to show

| Skill | Where it shows up |
| ----- | ----------------- |
| Asynchronous I/O in Python | `aiohttp` fetches with `asyncio.Semaphore(10)` and a 30s timeout so a page with many links does not open unbounded connections |
| Content-type routing | HTTP `Content-Type` chooses the parser (not the file extension) |
| Document text extraction | BeautifulSoup (HTML), PyPDF2 (PDF, page-aware), python-docx, openpyxl |
| A usable research UI | Streamlit form, progress bars for fetch vs search, match list with PDF page numbers |
| Reproducible run | Pinned `requirements.txt`, Dev Container / Codespaces, `runtime.txt` for Streamlit Cloud |

It is a **single-file prototype**, not a crawler framework. That is deliberate: one script you can read in a few minutes.

## How someone uses it

Open the Streamlit app (your hosted URL, or run it locally as below).

1. Paste a **starting URL**.
2. Enter **keywords**, comma-separated (`climate, funding, policy`).
3. Click **Submit**.
4. Read file-type counts and the matching links. PDF hits include page numbers.

**Stop** finishes the current download, then halts. **Reset** reloads the page.

Only links **on that first page** are followed. Images are counted, not OCR’d. Older `.doc` / `.xls` files are skipped.

## Design

```
Start URL
    │
    ▼
requests + BeautifulSoup  →  collect <a href>  (skip mailto:)
    │
    ▼
aiohttp (10 concurrent)   →  bytes + Content-Type
    │
    ├── text/html        →  visible text
    ├── application/pdf  →  text per page (\f-separated)
    ├── …wordprocessingml.document  →  paragraphs
    └── …spreadsheetml.sheet        →  cell values
    │
    ▼
case-insensitive substring search
    │
    ▼
Streamlit: counts + matching URLs
```

Choices worth looking at in [`linkalyser_streamlit.py`](linkalyser_streamlit.py):

- **Two phases** — download/parse, then search — so the UI can show progress separately.
- **PDF pages** — extracted pages are joined with form-feed so a hit can cite page numbers.
- **Bounded concurrency** — a semaphore caps parallel fetches.
- **Failed fetches stay quiet** — a bad link increments nothing useful in the match list rather than crashing the run. (Bare `except:` is a shortcut, not a pattern to copy.)

## Run it

Python 3.11+ and network access:

```bash
git clone https://github.com/RajeshTharyan/linkalyser.git
cd linkalyser
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run linkalyser_streamlit.py
```

Open [http://localhost:8501](http://localhost:8501).

Codespaces uses [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) and starts Streamlit on port 8501. Streamlit Community Cloud can point at `linkalyser_streamlit.py`; `runtime.txt` sets Python 3.11.

## Limits (on purpose)

- One hop: no recursive crawl, no JavaScript-rendered links.
- Mixed `requests` (start page) and `aiohttp` (linked URLs).
- Stop is a global flag checked between finished fetches; in-flight work may still complete.
- No tests or CI in this tree.

## License

MIT — see [LICENSE](LICENSE).
