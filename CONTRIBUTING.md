# Contributing to Linkalyser

Thanks for taking an interest in the project. Small, focused changes are welcome.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run linkalyser_streamlit.py
```

Python 3.11+ is recommended. Keep dependency versions in `requirements.txt` unless you have a reason to bump them.

## What to change

Most behaviour lives in `linkalyser_streamlit.py`:

- `parse_*` functions extract text from each file type
- `fetch_and_parse` routes by HTTP `Content-Type`
- `run_analysis` drives the Streamlit UI flow
- `analyse_links_async` / `keyword_search_async` handle the two analysis phases

If you add a file type, update both the parser and the statistics keys, and mention it in the README.

## Pull requests

1. Open an issue first if the change is large or changes user-facing behaviour.
2. Keep the app runnable with `streamlit run linkalyser_streamlit.py`.
3. Update `README.md` when you change how people use the tool.
4. Do not commit virtual environments, `__pycache__`, or `.streamlit/secrets.toml`.

## Reporting bugs

Include:

- The starting URL (or a reduced example)
- The keywords you used
- What you expected vs what happened
- Python and Streamlit versions (`streamlit --version`)
