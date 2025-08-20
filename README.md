# EMS-CEU Library

A set of EMS continuing education scrapers with Firebase integration and local emulators. The NAEMT scraper is production-ready and runs via Firebase Functions in the emulator.

## Quick start: NAEMT scraper via emulators

- From repo root, start emulators from the `scrapers` folder (no venv activation needed):
  ```bash
  cd scrapers
  firebase emulators:start --only functions,firestore --project ems-ceu-library
  ```
- In another terminal, run the test:
  ```bash
  cd scrapers
  python3.11 test_emulator.py
  ```
- Emulator UI: http://127.0.0.1:4000

More details and troubleshooting are in `scrapers/README.md`.

## Repository layout (high level)

- scrapers/ — NAEMT scraper, Firebase Functions (Python), emulator configs
- functions/ — Node JS functions (separate codebase)
- frontend/ — Web UI
- browser-service/ — Headless browser service (POC)
- ems_ceu_library/ — Python Functions scaffold (inactive)

## Security
- Never commit secrets. `.gitignore` excludes common secret files.
- For production deployments, configure service accounts securely and avoid printing secrets.

## Contributing
- Add new site scrapers under `scrapers/sites/<site>` and register them in `scrapers/functions/scraper_registry.py`.
- Keep emulator dependencies in `scrapers/functions/requirements.txt`.
- Keep local dev dependencies in `scrapers/requirements.txt`.
