from linkalyser.links import extract_links


def test_extracts_absolute_and_relative_links():
    html = """
    <a href="https://example.com/a">A</a>
    <a href="/b">B</a>
    <a href="c.html">C</a>
    """
    links = extract_links(html, "https://example.com/dir/page.html")
    assert links == [
        "https://example.com/a",
        "https://example.com/b",
        "https://example.com/dir/c.html",
    ]


def test_skips_mailto_fragments_and_duplicates():
    html = """
    <a href="mailto:x@example.com">mail</a>
    <a href="#section">frag</a>
    <a href="/same">one</a>
    <a href="/same">again</a>
    <a href="">empty</a>
    """
    links = extract_links(html, "https://example.com/")
    assert links == ["https://example.com/same"]
