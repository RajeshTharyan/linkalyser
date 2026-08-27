"""Download linked resources concurrently and parse them by Content-Type."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from typing import Any

import aiohttp

from .parsers import parse_excel, parse_html, parse_pdf, parse_word

EMPTY_STATS = {
    "HTML": 0,
    "PDF": 0,
    "Word Document": 0,
    "Excel": 0,
    "Image": 0,
    "Other": 0,
}

ProgressCallback = Callable[[int, int], None]
StopCallback = Callable[[], bool]


def empty_stats() -> dict[str, int]:
    return dict(EMPTY_STATS)


def _content_type(headers: Any) -> str:
    return (headers.get("content-type") or "").lower()


async def fetch_and_parse(
    session: aiohttp.ClientSession,
    url: str,
    stats: dict[str, int],
    stats_lock: asyncio.Lock,
) -> tuple[str, str]:
    try:
        async with session.get(url) as response:
            response.raise_for_status()
            content_type = _content_type(response.headers)
            data = await response.read()
    except (aiohttp.ClientError, asyncio.TimeoutError, OSError):
        return url, ""

    if "application/pdf" in content_type:
        kind, text = "PDF", parse_pdf(data)
    elif "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in content_type:
        kind, text = "Word Document", parse_word(data)
    elif "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in content_type:
        kind, text = "Excel", parse_excel(data)
    elif "text/html" in content_type:
        kind, text = "HTML", parse_html(data)
    elif content_type.startswith("image/"):
        kind, text = "Image", ""
    else:
        kind, text = "Other", ""

    async with stats_lock:
        stats[kind] += 1
    return url, text


async def analyse_links(
    links: list[str],
    stats: dict[str, int],
    progress: ProgressCallback | None = None,
    should_stop: StopCallback | None = None,
    concurrency: int = 10,
    timeout_seconds: float = 30,
) -> list[tuple[str, str]]:
    results: list[tuple[str, str]] = []
    timeout = aiohttp.ClientTimeout(total=timeout_seconds)
    semaphore = asyncio.Semaphore(concurrency)
    stats_lock = asyncio.Lock()

    async with aiohttp.ClientSession(timeout=timeout) as session:

        async def bound_fetch(link: str) -> tuple[str, str]:
            async with semaphore:
                return await fetch_and_parse(session, link, stats, stats_lock)

        tasks = [asyncio.create_task(bound_fetch(link)) for link in links]
        completed = 0
        for coro in asyncio.as_completed(tasks):
            if should_stop and should_stop():
                for task in tasks:
                    task.cancel()
                break
            try:
                url, content = await coro
            except asyncio.CancelledError:
                break
            results.append((url, content))
            completed += 1
            if progress:
                progress(completed, len(links))
    return results
