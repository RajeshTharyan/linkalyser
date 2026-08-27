"""Linkalyser: follow links on a page and search linked documents for keywords."""

from .links import extract_links
from .parsers import parse_excel, parse_html, parse_pdf, parse_word
from .search import search_keywords

__all__ = [
    "extract_links",
    "parse_excel",
    "parse_html",
    "parse_pdf",
    "parse_word",
    "search_keywords",
]
