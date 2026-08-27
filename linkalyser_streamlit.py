"""Streamlit UI for Linkalyser. Analysis logic lives in the ``linkalyser`` package."""

import requests
import streamlit as st

from linkalyser.analysis import run_analysis

st.set_page_config(page_title="Linkalyser", page_icon="🔍")

if "stop_requested" not in st.session_state:
    st.session_state.stop_requested = False

st.title("🔍 Linkalyser")

st.sidebar.header("How to use")
st.sidebar.markdown(
    """
Paste a web page and the words you care about. Linkalyser follows every
link on that page, reads HTML, PDF, Word, and Excel files, and lists
which links contain your keywords.

1. **URL** — the page whose links you want to scan (not a recursive crawl).
2. **Keywords** — comma-separated, e.g. `climate, funding, policy`.
3. **Submit** — fetch links, then search. Watch the two progress bars.
4. **Stop** — asked between finished downloads (the UI is busy while a run is in progress).
5. **Reset** — reload the app and start over.

Images are counted but not searched. Older `.doc` / `.xls` files are skipped.
"""
)

url = st.text_input("Enter the URL to start the search:")
kw_input = st.text_input("Enter keywords (comma-separated):")

submit, stop, reset = st.columns(3)


def _should_stop() -> bool:
    return bool(st.session_state.stop_requested)


def _show_stats(stats: dict, header: str) -> None:
    st.write(f"### {header}")
    st.write(" | ".join(f"{name}: {count}" for name, count in stats.items()))


if submit.button("Submit"):
    st.session_state.stop_requested = False
    if not url or not kw_input:
        st.error("Please provide both URL and keywords.")
    else:
        keywords = [part.strip() for part in kw_input.split(",") if part.strip()]
        phase1 = st.progress(0)
        phase2 = st.progress(0)

        def on_fetch(done: int, total: int) -> None:
            if total:
                phase1.progress(done / total)

        def on_search(done: int, total: int) -> None:
            if total:
                phase2.progress(done / total)

        try:
            links, stats, matches = run_analysis(
                url,
                keywords,
                progress_fetch=on_fetch,
                progress_search=on_search,
                should_stop=_should_stop,
            )
        except requests.RequestException as exc:
            st.error(f"Could not fetch the starting URL: {exc}")
        else:
            st.write(
                f"Found {len(links)} link{'s' if len(links) != 1 else ''} to analyse."
            )
            _show_stats(stats, "After content analysis")
            _show_stats(stats, "Final statistics")
            st.write("### Keyword search results")
            if not matches:
                st.write("No keyword(s) found.")
            for match in matches:
                keyword_bits = ", ".join(
                    f"{keyword} (Page: {','.join(map(str, pages))})"
                    for keyword, pages in match["keywords"].items()
                )
                st.markdown(
                    f"- **URL:** [{match['url']}]({match['url']})  \n"
                    f"  **Keywords:** {keyword_bits}"
                )

if stop.button("Stop"):
    st.session_state.stop_requested = True
    st.info("Stop requested. It takes effect after the download already in flight.")

if reset.button("Reset"):
    st.session_state.stop_requested = False
    st.rerun()
