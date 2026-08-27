"""Orchestrate: fetch the start page, follow links, then search."""

from __future__ import annotations

import asyncio

import requests

from .fetch import ProgressCallback, StopCallback, analyse_links, empty_stats
from .links import extract_links
from .search import search_keywords


def fetch_start_page(url: str, timeout_seconds: float = 30) -> str:
    response = requests.get(url, timeout=timeout_seconds)
    response.raise_for_status()
    return response.text


def keyword_search(
    link_contents: list[tuple[str, str]],
    keywords: list[str],
    progress: ProgressCallback | None = None,
    should_stop: StopCallback | None = None,
) -> list[dict]:
    results = []
    total = len(link_contents)
    for index, (url, content) in enumerate(link_contents, start=1):
        if should_stop and should_stop():
            break
        found = search_keywords(content, keywords)
        if found:
            results.append({"url": url, "keywords": found})
        if progress:
            progress(index, total)
    return results


def run_analysis(
    url: str,
    keywords: list[str],
    progress_fetch: ProgressCallback | None = None,
    progress_search: ProgressCallback | None = None,
    should_stop: StopCallback | None = None,
) -> tuple[list[str], dict[str, int], list[dict]]:
    html = fetch_start_page(url)
    links = extract_links(html, url)
    stats = empty_stats()
    link_contents = asyncio.run(
        analyse_links(links, stats, progress=progress_fetch, should_stop=should_stop)
    )
    matches = keyword_search(
        link_contents, keywords, progress=progress_search, should_stop=should_stop
    )
    return links, stats, matches
