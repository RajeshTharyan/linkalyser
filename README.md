# Linkalyser

Linkalyser is a Streamlit application that crawls a starting URL, fetches linked content asynchronously, and highlights the links whose contents contain user-specified keywords.

## Prerequisites

- Python 3.9 or later
- A virtual environment is recommended but optional.

## Installation

1. Install the Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Running the Streamlit app

Launch the application with Streamlit:

```bash
streamlit run linkalyser_streamlit.py
```

This command starts a local development server (Streamlit prints the URL, typically `http://localhost:8501`).

## Using the app

1. Open the URL printed by Streamlit in your browser.
2. Enter a starting URL and comma-separated keywords.
3. Click **Submit** to begin analysis.
4. Use **Stop** to abort an in-progress crawl and **Reset** to clear the session state.

The app displays download statistics for each content type and lists the links that match your keywords.

## Optional: Frontend components

The repository also contains React components under `frontend/` that can be embedded into another project. They are not wired into the Streamlit workflow.
