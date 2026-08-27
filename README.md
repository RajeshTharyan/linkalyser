# Linkalyser

A Streamlit app that takes a starting web page, follows every link on it, and searches the linked content for your keywords.

Use it when you want a quick scan of a page’s outgoing links — HTML pages, PDFs, Word documents, and Excel spreadsheets — without opening each one by hand.

## What it does

1. Fetches the URL you provide and collects every `href` on that page (except `mailto:` links).
2. Downloads each linked resource concurrently (up to 10 at a time, 30-second timeout).
3. Extracts text from HTML, PDF, Word (`.docx`), and Excel (`.xlsx`) files.
4. Searches that text for your keywords (case-insensitive).
5. Shows file-type counts and a list of matching URLs, including PDF page numbers when a keyword is found.

## Requirements

- Python 3.11 or newer (3.11 is used in the included Dev Container)
- A network connection (the app fetches live URLs)

## Quick start

```bash
git clone https://github.com/RajeshTharyan/linkalyser.git
cd linkalyser
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run linkalyser_streamlit.py
```

The app opens in your browser at [http://localhost:8501](http://localhost:8501).

### GitHub Codespaces / Dev Container

This repo includes a [Dev Container](.devcontainer/devcontainer.json). Opening it in GitHub Codespaces or VS Code with the Dev Containers extension:

- installs dependencies from `requirements.txt`
- starts Streamlit on port **8501**
- forwards that port so you can use the app in the preview pane

## How to use

1. Enter the **starting URL** (the page whose links you want to analyse).
2. Enter **keywords**, separated by commas (for example: `climate, funding, policy`).
3. Click **Submit**.
4. Watch the two progress bars:
   - first pass: download and parse each link
   - second pass: keyword search
5. Review the statistics and the matching URLs.

Buttons:

| Button   | Action |
| -------- | ------ |
| Submit   | Start analysis. Both URL and keywords are required. |
| Stop     | Request that the current run stop after the next finished fetch. |
| Reset    | Clear the stop flag and reload the app. |

## Supported content types

| Content type | How it is handled |
| ------------ | ----------------- |
| HTML (`text/html`) | Visible text is extracted with BeautifulSoup. |
| PDF (`application/pdf`) | Text is extracted per page with PyPDF2. Matches include page numbers. |
| Word (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`) | Paragraph text from `.docx` files. |
| Excel (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) | Cell values from every worksheet in `.xlsx` files. |
| Images | Counted in statistics; not searched (no OCR). |
| Other / failed fetches | Counted as Other or skipped; no text search. |

Content-type detection uses the HTTP `Content-Type` header, not the file extension.

## How it works

```
Start URL
    │
    ▼
Fetch page  ──►  Collect <a href> links  (skip mailto:)
    │
    ▼
Async fetch (aiohttp, 10 concurrent, 30s timeout)
    │
    ├── HTML  → BeautifulSoup text
    ├── PDF   → PyPDF2 (pages joined with form-feed)
    ├── Word  → python-docx
    └── Excel → openpyxl
    │
    ▼
Case-insensitive keyword search
    │
    ▼
Streamlit report: counts + matching URLs
```

Keyword search on PDFs is page-aware: extracted pages are split on form-feed (`\f`), so results can show which page a keyword appeared on.

## Limitations

- Only links on the **starting page** are followed. There is no recursive crawl of deeper pages.
- Relative links are resolved against the starting URL; JavaScript-rendered or pagination-loaded links are not collected.
- Sites that block scrapers, require login, or rate-limit requests may return empty results.
- Older `.doc` / `.xls` files are not parsed (only `.docx` and `.xlsx`).
- Images and unknown types are not searched.
- The Stop button sets a flag checked between fetches; work already in flight may still finish.

Respect site terms of use and `robots.txt` when you point this tool at other people’s pages. See [SECURITY.md](SECURITY.md).

## Project layout

```
linkalyser/
├── linkalyser_streamlit.py   # Streamlit UI and analysis logic
├── requirements.txt          # Python dependencies (pinned)
├── runtime.txt               # Python version for Streamlit Community Cloud
├── .devcontainer/            # Codespaces / VS Code Dev Container
└── README.md
```

## Deploy on Streamlit Community Cloud

1. Fork or push this repository to GitHub.
2. Go to [share.streamlit.io](https://share.streamlit.io) and sign in with GitHub.
3. Create a new app pointing at `linkalyser_streamlit.py`.
4. `runtime.txt` and `requirements.txt` are picked up automatically.

## License

MIT — see [LICENSE](LICENSE).
