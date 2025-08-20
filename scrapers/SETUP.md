# Setup Instructions - EMS Event Scraper v1

## Prerequisites

- GitHub account (free)
- Firebase project (free tier)
- Firebase CLI installed
- Python 3.9+ (for local testing)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project (if you don't have one)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new project or use existing
firebase projects:list
```

### 1.2 Initialize Firebase in this folder

```bash
cd scraper-v1-minimal

# Initialize Firebase (select Functions and Hosting)
firebase init

# Select your existing project
# Choose TypeScript: No (we're using Python)
# Install dependencies: Yes
```

### 1.3 Get Firebase credentials

```bash
# Create service account
firebase projects:list
export PROJECT_ID="your-project-id"

# Go to Firebase Console > Project Settings > Service Accounts
# Click "Generate new private key"
# Download the JSON file
```

## Step 2: GitHub Setup

### 2.1 Create GitHub Repository

```bash
# Create new repo or use existing
# Copy this scraper-v1-minimal folder to your repo
```

### 2.2 Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS=<paste entire service account JSON>
```

### 2.3 Enable GitHub Actions

In your repository:
- Go to "Actions" tab
- Enable Actions if disabled
- The workflow will be auto-detected from `.github/workflows/scrape-events.yml`

## Step 3: Deploy Cloud Functions

```bash
cd scraper-v1-minimal

# Deploy functions to Firebase
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

## Step 4: Configure Cloud Scheduler (Optional)

```bash
# Create scheduled jobs (3 free per month)
gcloud scheduler jobs create http high-priority-scraper \
  --schedule="0 */6 * * *" \
  --uri="https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/scrape-events.yml/dispatches" \
  --http-method=POST \
  --headers="Authorization=token YOUR_GITHUB_TOKEN,Accept=application/vnd.github.v3+json" \
  --message-body='{"ref":"main","inputs":{"priority":"high"}}'

gcloud scheduler jobs create http medium-priority-scraper \
  --schedule="0 */12 * * *" \
  --uri="https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/scrape-events.yml/dispatches" \
  --http-method=POST \
  --headers="Authorization=token YOUR_GITHUB_TOKEN,Accept=application/vnd.github.v3+json" \
  --message-body='{"ref":"main","inputs":{"priority":"medium"}}'
```

## Step 5: Test the System

### 5.1 Manual Test Run

```bash
# Local testing
cd scraper-v1-minimal
pip install -r requirements.txt

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Test scraping one site
python scripts/scrape_site.py --site naemt --dry-run

# Test with real data
python scripts/scrape_site.py --site naemt
```

### 5.2 GitHub Actions Test

1. Go to your GitHub repo → Actions
2. Click "Scrape EMS Events" workflow
3. Click "Run workflow"
4. Select "high" priority
5. Click "Run workflow"

### 5.3 Verify Results

```bash
# Check Firestore data
firebase firestore:get events_raw --limit 5
firebase firestore:get events --limit 5

# Check Cloud Function logs
firebase functions:log
```

## Step 6: Monitor Usage

### 6.1 Firebase Usage Dashboard

- Go to Firebase Console → Usage and billing
- Monitor Firestore reads/writes
- Monitor Function invocations
- Monitor Storage usage

### 6.2 GitHub Actions Usage

- Go to GitHub repo → Settings → Billing
- Monitor Actions minutes used
- You get 2000 free minutes/month

## Step 7: Add More Sites

### 7.1 Edit Site Configuration

```bash
# Edit config/sites.json to add new sites
vim config/sites.json

# Add site adapter
vim scripts/site_adapters.py
```

### 7.2 Test New Site

```bash
python scripts/scrape_site.py --site new-site-name --dry-run
```

## Troubleshooting

### Common Issues

**GitHub Actions failing:**
- Check GitHub Secrets are set correctly
- Verify Firebase credentials JSON is valid
- Check repo permissions

**Cloud Functions errors:**
- Check Firebase project permissions
- Verify Firestore rules allow writes
- Check function logs: `firebase functions:log`

**No events found:**
- Check site HTML structure hasn't changed
- Verify selectors in site_adapters.py
- Test site accessibility: `curl -I https://site.com`

**Hitting free tier limits:**
- Monitor Firebase usage dashboard
- Reduce scraping frequency
- Implement more selective scraping

### Getting Help

1. Check logs: `firebase functions:log`
2. Test locally: `python scripts/scrape_site.py --site test --dry-run`
3. Verify Firebase rules: Firebase Console → Firestore → Rules
4. Check GitHub Actions logs: GitHub repo → Actions

## Next Steps

Once basic setup works:

1. **Add more sites** via `config/sites.json`
2. **Tune schedules** via `config/schedules.json`
3. **Monitor costs** via Firebase Console
4. **Scale up** by upgrading Firebase plan when needed

## Security Notes

- Never commit service account JSON files
- Use GitHub Secrets for all credentials
- Regularly rotate access tokens
- Monitor for unusual usage patterns