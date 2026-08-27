from linkalyser.analysis import keyword_search
from linkalyser.fetch import empty_stats


def test_empty_stats_copy_is_independent():
    first = empty_stats()
    second = empty_stats()
    first["PDF"] = 3
    assert second["PDF"] == 0


def test_keyword_search_returns_only_matching_urls():
    contents = [
        ("https://a.example/x", "talks about climate on this page"),
        ("https://a.example/y", "nothing relevant"),
        ("https://a.example/z.pdf", "intro\fclimate appears on page two"),
    ]
    matches = keyword_search(contents, ["climate"])
    urls = [item["url"] for item in matches]
    assert urls == ["https://a.example/x", "https://a.example/z.pdf"]
    pdf_hit = next(item for item in matches if item["url"].endswith(".pdf"))
    assert pdf_hit["keywords"]["climate"] == [2]
