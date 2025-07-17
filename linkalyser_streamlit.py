import requests
from bs4 import BeautifulSoup
import PyPDF2
import docx
import openpyxl
from urllib.parse import urljoin
from io import BytesIO
import streamlit as st
import time
import webbrowser

# --- Helper functions (copied from original) ---
def fetch_html(url):
    response = requests.get(url)
    return response.text

def extract_links(html_content, base_url):
    soup = BeautifulSoup(html_content, 'html.parser')
    links = [urljoin(base_url, a['href']) for a in soup.find_all('a', href=True) if not a['href'].startswith('mailto:')]
    return links

def download_and_parse(url, stats):
    try:
        response = requests.get(url)
        response.raise_for_status()
        content_type = response.headers.get('content-type', '')
        if 'application/pdf' in content_type:
            stats['PDF'] += 1
            return parse_pdf(response.content)
        elif 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type:
            stats['Word Document'] += 1
            return parse_word(response.content)
        elif 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in content_type:
            stats['Excel'] += 1
            return parse_excel(response.content)
        elif 'text/html' in content_type:
            stats['HTML'] += 1
            return parse_html(response.content)
        elif 'image/' in content_type:
            stats['Image'] += 1
            return ""
        else:
            stats['Other'] += 1
            return ""
    except requests.RequestException:
        return ""

def parse_pdf(content):
    try:
        reader = PyPDF2.PdfReader(BytesIO(content))
        text = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
        return "\f".join(text)
    except Exception:
        return ""

def parse_word(content):
    try:
        doc = docx.Document(BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception:
        return ""

def parse_excel(content):
    try:
        wb = openpyxl.load_workbook(BytesIO(content), data_only=True)
        text = []
        for ws in wb.worksheets:
            for row in ws.iter_rows(values_only=True):
                text.append(" ".join([str(cell) for cell in row if cell is not None]))
        return "\n".join(text)
    except Exception:
        return ""

def parse_html(content):
    soup = BeautifulSoup(content, 'html.parser')
    return soup.get_text() or ""

def search_keywords(text, keywords):
    found_keywords = {}
    pages = text.split('\f')
    for page_number, page in enumerate(pages, start=1):
        page_lower = page.lower()
        for keyword in keywords:
            keyword_lower = keyword.lower()
            if keyword_lower in page_lower:
                if keyword not in found_keywords:
                    found_keywords[keyword] = []
                found_keywords[keyword].append(page_number)
    return found_keywords

# --- Streamlit App ---
st.set_page_config(page_title="Linkalyser", layout="wide")
st.title("Linkalyser (Streamlit Edition)")

if 'stop_search' not in st.session_state:
    st.session_state.stop_search = False
if 'results' not in st.session_state:
    st.session_state.results = []
if 'stats' not in st.session_state:
    st.session_state.stats = {'HTML': 0, 'PDF': 0, 'Word Document': 0, 'Excel': 0, 'Image': 0, 'Other': 0}
if 'searching' not in st.session_state:
    st.session_state.searching = False
if 'search_finished' not in st.session_state:
    st.session_state.search_finished = False
if 'keyword_status' not in st.session_state:
    st.session_state.keyword_status = ""
if 'progress_log' not in st.session_state:
    st.session_state.progress_log = []

with st.form(key='search_form'):
    url = st.text_input("Enter the URL to start the search:")
    keywords_input = st.text_input("Enter the keywords to search for, separated by commas:")
    col1, col2, col3 = st.columns(3)
    submit_clicked = col1.form_submit_button("Submit")
    stop_clicked = col2.form_submit_button("Stop")
    reset_clicked = col3.form_submit_button("Reset")

if reset_clicked:
    st.session_state.results = []
    st.session_state.stats = {'HTML': 0, 'PDF': 0, 'Word Document': 0, 'Excel': 0, 'Image': 0, 'Other': 0}
    st.session_state.searching = False
    st.session_state.search_finished = False
    st.session_state.stop_search = False
    st.session_state.keyword_status = ""
    st.session_state.progress_log = []
    st.experimental_rerun()

if stop_clicked:
    st.session_state.stop_search = True
    st.session_state.searching = False
    st.session_state.keyword_status = "Search stopped."

# Place this before the search logic so it's always defined
progress_placeholder = st.empty()

if submit_clicked and url and keywords_input:
    st.session_state.results = []
    st.session_state.stats = {'HTML': 0, 'PDF': 0, 'Word Document': 0, 'Excel': 0, 'Image': 0, 'Other': 0}
    st.session_state.searching = True
    st.session_state.search_finished = False
    st.session_state.stop_search = False
    st.session_state.keyword_status = ""
    st.session_state.progress_log = []
    keywords = [k.strip() for k in keywords_input.split(',') if k.strip()]

    html_content = fetch_html(url)
    links = extract_links(html_content, url)
    total_links = len(links)
    link_contents = []
    stats = st.session_state.stats
    progress_log = []
    # Phase 1: Content type analysis and content extraction
    for i, link in enumerate(links, start=1):
        if st.session_state.stop_search:
            st.session_state.keyword_status = "Search stopped."
            st.session_state.searching = False
            progress_log.append("Search stopped.")
            progress_placeholder.write("\n".join(progress_log))
            break
        msg = f"Analyzing link {i}/{total_links}..."
        st.session_state.keyword_status = msg
        progress_log.append(msg)
        progress_placeholder.write("\n".join(progress_log))
        doc_content = download_and_parse(link, stats)
        link_contents.append({'url': link, 'content': doc_content})
    # Phase 2: Keyword search
    results = []
    for i, item in enumerate(link_contents, start=1):
        if st.session_state.stop_search:
            st.session_state.keyword_status = "Search stopped."
            st.session_state.searching = False
            progress_log.append("Search stopped.")
            progress_placeholder.write("\n".join(progress_log))
            break
        msg = f"Keyword search in progress: analyzing link {i}/{total_links}..."
        st.session_state.keyword_status = msg
        progress_log.append(msg)
        progress_placeholder.write("\n".join(progress_log))
        found_keywords = search_keywords(item['content'], keywords)
        if found_keywords:
            results.append({'url': item['url'], 'keywords': found_keywords})
    st.session_state.results = results
    st.session_state.searching = False
    st.session_state.search_finished = not st.session_state.stop_search
    st.session_state.keyword_status = ""
    progress_log.append("Search finished")
    progress_placeholder.write("\n".join(progress_log))
    st.session_state.progress_log = progress_log
    st.experimental_rerun()

# --- Display statistics ---
st.subheader("Linkalyser Statistics:")
stat_text = " | ".join([f"{key}: {value}" for key, value in st.session_state.stats.items()])
st.write(stat_text)

# --- Status ---
if st.session_state.keyword_status:
    st.info(st.session_state.keyword_status)

# --- Results ---
st.subheader("Results")
if st.session_state.searching:
    st.write("Searching...")
elif st.session_state.search_finished:
    st.success("Search finished")
    if st.session_state.results:
        for result in st.session_state.results:
            url = result['url']
            keywords_str = ', '.join([f"{k} (Page: {', '.join(map(str, v))})" for k, v in result['keywords'].items()])
            st.markdown(f"**URL:** [{url}]({url})")
            st.write(f"Keywords: {keywords_str}")
    else:
        st.warning("No Keyword(s) found!")

# --- Progress Log ---
st.subheader("Progress Log")
if 'progress_log' in st.session_state and st.session_state.progress_log:
    st.write("\n".join(st.session_state.progress_log)) 