from linkalyser.search import search_keywords


def test_case_insensitive_single_page():
    found = search_keywords("Climate Funding POLICY", ["climate", "funding"])
    assert found == {"climate": [1], "funding": [1]}


def test_pdf_page_numbers_use_form_feed():
    text = "alpha on first\fsecond page mentions Beta\fthird"
    found = search_keywords(text, ["alpha", "beta"])
    assert found["alpha"] == [1]
    assert found["beta"] == [2]


def test_keyword_can_appear_on_several_pages():
    text = "grant\fother\fgrant again"
    found = search_keywords(text, ["grant"])
    assert found["grant"] == [1, 3]


def test_blank_keywords_are_ignored():
    assert search_keywords("hello", ["", "  "]) == {}
