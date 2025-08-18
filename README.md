# EMS_CEU

A Python-based web scraping framework with Firebase (Firestore + Storage) persistence.\
This repository now includes a headless browser service (Playwright) and a Python client wrapper for a modular, MCP-style scraping pipeline.
This repository now includes a headless browser service (Playwright) and a Python client wrapper for a modular, MCP-style scraping pipeline.

Structure
- src/ems_ceu: core package
  - adapters/: per-site parsers
  - persistence/: Firestore/Storage wrappers
  - scheduler/: job leasing and worker loop
- tests/: unit and integration tests
- scripts/: helper scripts

Quick start
1) Python 3.10+
2) Create and activate a virtual environment
   - Windows (PowerShell):
     - py -3.10 -m venv .venv
     - .\.venv\Scripts\Activate.ps1
3) Install dependencies
   - python -m pip install -U pip
   - pip install -e .[dev]
4) Configure Firebase service account
   - Place your service account JSON at a secure path, then set:
     - $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\\secure\\path\\firebase-sa.json'
   - Replace your bucket name in config if needed.
5) Run a dry-fetch of a URL
   - python -m ems_ceu.cli fetch --url https://example.org/

Security
- Never commit secrets. .gitignore excludes .env by default.
- Use the GOOGLE_APPLICATION_CREDENTIALS environment variable; do not print its value.

Development

Browser service (POC)
- Start the browser service (requires Node 18+):
  1) cd browser-service
  2) npm install
  3) npx playwright install --with-deps chromium
  4) npm start
- Health: GET http://127.0.0.1:8787/healthz
- API: POST /session, /navigate, /waitFor, GET /content, POST /evaluate, /screenshot, POST /close

Python client POC
- Run a one-off render+extract from your venv:
  - python -m ems_ceu.render https://example.org/ --wait-for body --field links:a:href --field headings:"h1, h2"

Template example
- See templates/sample_site.json for a declarative extractor.
- Run tests: pytest
- Lint/format: ruff check .


# EMS_CEU
