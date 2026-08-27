"""Collect http(s) links from a starting HTML page."""

from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup


def extract_links(html: str, base_url: str) -> list[str]:
    """Return absolute URLs from ``<a href>``, skipping mailto and empty hrefs."""
    soup = BeautifulSoup(html, "html.parser")
    links: list[str] = []
    seen: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if not href or href.startswith("#") or href.lower().startswith("mailto:"):
            continue
        absolute = urljoin(base_url, href)
        scheme = urlparse(absolute).scheme
        if scheme not in {"http", "https"}:
            continue
        if absolute not in seen:
            seen.add(absolute)
            links.append(absolute)
    return links
