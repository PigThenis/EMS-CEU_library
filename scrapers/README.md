# EMS Event Scrapers

Production-ready scrapers for collecting EMS continuing education events. This folder also contains a Firebase Functions emulator setup for local testing of the NAEMT scraper.

## 🏗️ Structure

```
scrapers/
├── common/                  # Shared utilities
│   └── base_adapter.py      # Base scraper class
├── functions/               # Firebase Python Functions (emulator-ready)
│   ├── main.py              # HTTP functions: scrapeNAEMT, ping
│   ├── requirements.txt     # Runtime deps used by the emulator
│   └── venv/                # Auto-used by emulator (ignored by git)
├── sites/                   # Site-specific scrapers (library copy)
│   └── naemt/
│       ├── __init__.py
│       └── naemt_scraper.py
├── firebase.json            # Emulator config for scrapers
├── .firebaserc              # Project mapping for emulators
├── test_emulator.py         # Calls the function via emulator HTTP
└── requirements.txt         # Library/runtime deps for local dev
```

## 🚀 Quick start (emulator path)

From the repository root:

1) Install Python 3.11 (already present on this machine)
2) Ensure Firebase CLI is installed (already present: `firebase --version`)
3) Start emulators from `scrapers` (no venv activation needed):

```bash
cd scrapers
firebase emulators:start --only functions,firestore --project ems-ceu-library
```

You should see the emulator list these functions:
- us-central1-ping
- us-central1-scrapeNAEMT

4) In a second terminal, run the test:

```bash
cd scrapers
python3.11 test_emulator.py
```

Expected output includes a 200 status and a count of events, and the Emulator UI is at:
- http://127.0.0.1:4000

## 🧪 Troubleshooting

- Emulator can’t find SDK / functions not loaded
  - The emulator automatically uses `scrapers/functions/venv`.
  - If needed, reinstall deps into that venv:
    ```bash
    scrapers/functions/venv/bin/python -m pip install -r scrapers/functions/requirements.txt
    ```
  - Then stop and restart the emulators.

- 404: Function does not exist
  - Ensure you started the emulators from `scrapers/` and not the repo root.
  - Confirm startup logs show `Loaded functions: ping, scrapeNAEMT`.

- 500 errors from scrape
  - Network hiccups or site changes can cause scraping to fail. The function now returns structured JSON errors. Re-run the test or try later.

## 📊 Current Status

- ✅ NAEMT: working via emulator (functions + Firestore)
- More providers can be added using the shared base adapter.

## 🔧 Adding New Scrapers

1. Create `scrapers/sites/<site_name>/` and implement a class extending `BaseSiteAdapter`.
2. Register it in `scrapers/functions/scraper_registry.py`.
3. Add any extra deps to `scrapers/functions/requirements.txt` (for emulator) and `scrapers/requirements.txt` (for local dev).
4. Restart the emulators and add a new test, following `test_emulator.py` as a template.

## 🗄️ Event Schema

```json
{
  "title": "PHTLS - 10th Edition Provider",
  "date": "2025-09-15",
  "end_date": "2025-09-16",
  "location": "Nashville, TN",
  "instructor": "John Smith",
  "course_type": "PHTLS",
  "open_to_public": "Yes",
  "provider": "NAEMT",
  "source_url": "https://naemt.org/education/CourseDirectory?..."
}
```

## 🔗 Integration

- The emulator writes to Firestore emulator (port 8080).
- For production, configure Firebase and deploy Python Functions as needed.
