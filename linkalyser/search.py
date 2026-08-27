"""Case-insensitive keyword search. PDF page breaks are form-feed characters."""

from collections.abc import Iterable


def search_keywords(text: str, keywords: Iterable[str]) -> dict[str, list[int]]:
    """Return each keyword mapped to 1-based page numbers where it appears.

    Non-PDF text is treated as a single page. PDF extractors join pages with
    ``\\f`` so callers can show page numbers in the UI.
    """
    pages = text.split("\f")
    found: dict[str, list[int]] = {}
    cleaned = [keyword.strip() for keyword in keywords if keyword and keyword.strip()]
    for index, page in enumerate(pages, start=1):
        lowered = page.lower()
        for keyword in cleaned:
            if keyword.lower() in lowered:
                found.setdefault(keyword, []).append(index)
    return found
