# Security and responsible use

Linkalyser fetches whatever URLs appear as links on the page you give it. Treat it like a lightweight crawler, not a general-purpose browser.

## Using the app

- Only analyse sites you are allowed to access. Follow each site’s terms of use and `robots.txt`.
- Do not point it at pages that require login, paywalled content, or personal data you should not collect.
- The tool does not authenticate, store cookies, or persist fetched content to disk. Results live in the Streamlit session until you reset or close the app.
- Fetches are concurrent (up to 10 at a time). Avoid hammering small sites; prefer a starting page with a modest number of links when you are testing.

## Running it yourself

- Do not commit Streamlit secrets. `.streamlit/secrets.toml` is listed in `.gitignore`.
- The Dev Container starts Streamlit with CORS and XSRF protection disabled so Codespaces preview works. Use the default Streamlit settings (`streamlit run linkalyser_streamlit.py`) on any network you do not fully trust.
- Dependencies are pinned in `requirements.txt`. Review and bump them when you deploy.

## Reporting a vulnerability

If you find a security issue in this repository, please open a private report via GitHub Security Advisories on [RajeshTharyan/linkalyser](https://github.com/RajeshTharyan/linkalyser), or email the maintainer. Do not file a public issue with exploit details.
