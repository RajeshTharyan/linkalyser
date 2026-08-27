# Contributing to Linkalyser

## Run the app

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run linkalyser_streamlit.py
```

Python 3.11+ is recommended.

## Tests

```bash
pip install -r requirements-dev.txt
pytest -q
```

GitHub Actions runs the same tests on each push and pull request.

## Layout

| Path | Role |
| ---- | ---- |
| `linkalyser_streamlit.py` | Streamlit UI only |
| `linkalyser/analysis.py` | Orchestrates a run |
| `linkalyser/links.py` | Collect `<a href>` targets |
| `linkalyser/fetch.py` | Concurrent download and Content-Type routing |
| `linkalyser/parsers.py` | PDF / Word / Excel / HTML text |
| `linkalyser/search.py` | Keyword hits and PDF page numbers |
| `tests/` | Pytest |

If you add a file type, update the parser, the stats keys in `fetch.py`, a test, and the README.

## Pull requests

Keep `streamlit run linkalyser_streamlit.py` working. Do not commit `.venv`, `__pycache__`, or `.streamlit/secrets.toml`.
