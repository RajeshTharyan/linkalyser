# Linkalyser

A Streamlit app that takes one web page, follows every link on it, and searches the linked **HTML, PDF, Word, and Excel** files for your keywords.

Built as a small, readable Python project: concurrent fetches, several document parsers, and a browser UI.

![Linkalyser UI with How to use sidebar](docs/images/linkalyser-ui.png)

[![Tests](https://github.com/RajeshTharyan/linkalyser/actions/workflows/ci.yml/badge.svg)](https://github.com/RajeshTharyan/linkalyser/actions/workflows/ci.yml)
[![Open in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Open-blue?logo=github)](https://codespaces.new/RajeshTharyan/linkalyser)
[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://share.streamlit.io/deploy?repository=RajeshTharyan/linkalyser&branch=main&mainModule=linkalyser_streamlit.py)

There is no long-lived hosted demo URL in this repository yet. Use **Open in Streamlit** (your Streamlit Community Cloud account) or **Codespaces** to run the live app without installing Python locally. After you deploy, put that `*.streamlit.app` URL here so visitors can click once.

## What this repo is meant to show

| Skill | Where it shows up |
| ----- | ----------------- |
| Package layout | `linkalyser/` (parse, fetch, search) vs `linkalyser_streamlit.py` (UI only) |
| Asynchronous I/O | `aiohttp` with `asyncio.Semaphore(10)`, timeouts, and a lock around shared stats |
| Content-type routing | HTTP `Content-Type` chooses the parser, not the file name |
| Document extraction | BeautifulSoup, PyPDF2 (page-aware), python-docx, openpyxl |
| Tested behaviour | `tests/` — links, keyword/page hits, HTML/Word/Excel parsers |
| Reproducible run | pinned `requirements.txt`, Dev Container, `runtime.txt`, GitHub Actions |

## How someone uses it

1. Open the Streamlit app (Codespaces, Streamlit Cloud, or local run below).
2. Paste a **starting URL**.
3. Enter **keywords**, comma-separated (`climate, funding, policy`).
4. Click **Submit**.
5. Read file-type counts and matching links. PDF hits include page numbers.

**Stop** is recorded in `st.session_state` and checked between finished downloads. While a run is in progress Streamlit is busy, so Stop applies on the next opportunity, not mid-socket. **Reset** calls `st.rerun()`.

Only links **on that first page** are followed.

## Design

```
linkalyser_streamlit.py     Streamlit widgets
        │
        ▼
linkalyser/analysis.py      fetch start page → follow links → search
        │
        ├── links.py        <a href> → absolute http(s) URLs
        ├── fetch.py        aiohttp, Content-Type, concurrency cap
        ├── parsers.py      PDF / Word / Excel / HTML → text
        └── search.py       case-insensitive hits, PDF pages via \\f
```

```
Start URL  →  requests
    │
    ▼
extract_links
    │
    ▼
aiohttp (10 concurrent, 30s timeout)
    │
    ├── text/html                         →  visible text
    ├── application/pdf                   →  text per page
    ├── …wordprocessingml.document        →  paragraphs
    └── …spreadsheetml.sheet              →  cell values
    │
    ▼
search_keywords  →  Streamlit report
```

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

```bash
pip install -r requirements-dev.txt
pytest -q
```

## Limits

- One hop: no recursive crawl, no JavaScript-rendered links.
- `requests` loads the start page; `aiohttp` loads the linked URLs.
- Corrupt or unknown files return empty text rather than aborting the run.

## License

MIT — see [LICENSE](LICENSE).
