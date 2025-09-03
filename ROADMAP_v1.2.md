# EMS-CEU Library Project Roadmap (v1.2)
**Last updated: December 3, 2024**

## Project Overview
A platform for EMS professionals to discover, filter, and track CE across providers (AHA/NAEMT/ITLS/etc.), with a clean ingestion → normalization → publish pipeline and a CEU tracker aligned to NCCP 2025.

## Current Status ✅ (verified via testing)

### Working Components
- ✅ **Firebase emulators** (Functions, Firestore, UI) running locally
- ✅ **NAEMT scraper** functional via Python Firebase Functions (~50 events/run)
- ✅ **Data flow pipeline**: Scraper → Firestore → Frontend API working
- ✅ **Next.js frontend** successfully fetches and displays real Firestore data
- ✅ **Browser service** (Playwright) operational but isolated
- ✅ **Frontend filters** working client-side on real data

### Partially Working
- ⚠️ **Authentication**: Mock endpoints respond but no persistence
- ⚠️ **Profile API**: Endpoints exist but data not saved
- ⚠️ **Node.js Functions**: Setup exists but unused (TypeScript errors)

### Not Implemented
- ❌ **Publisher pipeline** (events_raw → events normalization)
- ❌ **Production deployment** configuration
- ❌ **Real authentication** (Firebase Auth not configured)
- ❌ **Security rules** properly configured (currently blocking direct access)
- ❌ **Other scrapers** (only NAEMT implemented)
- ❌ **Tests** of any kind

## Architecture Corrections

### Actual Architecture
```
Python Firebase Functions (scrapers/)
    ↓
Firestore Emulator
    ↓
Next.js API Routes (frontend/app/api/)
    ↓
React Frontend
```

### Key Findings
1. **Two separate Firebase Function codebases**: Python (working) and Node.js (unused)
2. **Frontend successfully connects** to Firestore via Admin SDK
3. **No Firebase client SDK** configured in frontend
4. **Docker configs** in `/docs` describe different architecture (not used)

## Phase 1 — MVP Launch 🚀 (revised priorities)

### 1.1 Fix Foundation Issues (IMMEDIATE)
- [ ] **Consolidate Firebase Functions**
  - Decision: Use Python for scrapers, Node.js for API logic OR consolidate
  - Remove unused GenKit sample code
  - Fix TypeScript compilation errors
  
- [ ] **Implement Real Authentication**
  - Enable Firebase Auth (email/password + Google)
  - Replace mock `/api/auth/*` endpoints
  - Add Firebase client SDK to frontend
  - Implement session management

- [ ] **Fix Firestore Security Rules**
  ```javascript
  // Current rules are blocking; need:
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /events_raw/{document=**} {
        allow read: if request.auth != null;
        allow write: if false; // Server-only
      }
      match /events/{document=**} {
        allow read: if true; // Public read
        allow write: if false; // Server-only
      }
    }
  }
  ```

### 1.2 Publisher Pipeline (HIGH)
- [ ] **Create Publisher Function** (Python or Node.js)
  ```python
  # events_raw → events transformation
  - Normalize dates, locations
  - Geocode addresses
  - Deduplicate events
  - Add modality classification
  - Set TTL for expiration
  ```
- [ ] **Chain after scraper runs**
- [ ] **Remove frontend fallback to seed data**

### 1.3 API Improvements (HIGH)
- [ ] **Implement server-side filtering**
  - Move from client-side to API query params
  - Add pagination support
  - Implement proper error handling
  
- [ ] **API Routes to implement**:
  ```typescript
  GET /api/events?from&to&state&modality&courseType&city&limit&offset
  GET /api/events/[id]
  POST /api/profile (make it actually save)
  GET /api/profile/[userId]
  ```

### 1.4 Deployment Preparation
- [ ] **Environment configuration**
  - Create `.env.local` for development
  - Setup Firebase project (not just emulator)
  - Configure service account credentials
  
- [ ] **Basic CI/CD**
  - GitHub Actions for tests (when added)
  - Deploy scripts for Functions and Frontend

## Phase 2 — Scale Supply & Features

### 2.1 More Scrapers (Efficiency Focus)
- [ ] **Scraper Factory Pattern**
  ```python
  # Suggestion: Create generic scraper classes
  class TableScraper(BaseSiteAdapter)  # For HTML tables
  class EnrollwareScraper(BaseSiteAdapter)  # For Enrollware sites
  class JSONAPIScraper(BaseSiteAdapter)  # For JSON APIs
  ```
  
- [ ] **Priority scrapers**:
  - RedCross (already scaffolded)
  - AHA Training Centers (via Enrollware adapter)
  - State EMS offices
  - CAPCE course catalog

### 2.2 Browser Service Integration
- [ ] **Connect browser-service to scrapers**
  - Use for JavaScript-heavy sites
  - Session management for login-required content
  - Screenshot capabilities for debugging

### 2.3 CEU Tracker (simplified MVP)
- [ ] **User model with persistence**
  - Store in Firestore users collection
  - Track certification level, state, expiry
  
- [ ] **Basic tracking**:
  - Manual CEU entry
  - Link to attended events
  - Simple progress visualization

## Efficiency Improvements Identified 🚀

### 1. **Consolidate Firebase Setup**
Currently have two Firebase function codebases. Recommendation:
- Use **Python Functions** for all scrapers and data processing
- Use **Next.js API routes** for user-facing APIs (already working well)
- Remove unused Node.js functions

### 2. **Simplify Authentication**
Instead of building custom auth:
```typescript
// Use NextAuth.js with Firebase adapter
npm install next-auth @next-auth/firebase-adapter
```

### 3. **Batch Operations**
```python
# Current: Individual writes
for event in events:
    db.collection('events_raw').add(event)

# Better: Batch writes (500 ops max)
batch = db.batch()
for event in events[:500]:
    doc_ref = db.collection('events_raw').document()
    batch.set(doc_ref, event)
batch.commit()
```

### 4. **Caching Strategy**
```typescript
// Add Redis or in-memory caching for events
import { LRUCache } from 'lru-cache'
const cache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 5 })
```

### 5. **Testing Approach**
Start with integration tests using emulator:
```bash
# Create test script
firebase emulators:exec --only firestore,functions "npm test"
```

## Technical Debt Priority 🔨

### Critical (Do Now)
1. Remove mock authentication
2. Fix security rules
3. Handle API errors properly
4. Add environment variables

### Important (Do Soon)
1. Add TypeScript types for data models
2. Implement proper logging
3. Add basic tests
4. Document API endpoints

### Nice to Have
1. Rate limiting
2. Request validation (zod)
3. Error monitoring (Sentry)
4. Performance monitoring

## Revised Milestones

### Week 1-2: Foundation
- [ ] Real authentication working
- [ ] Security rules fixed
- [ ] Publisher pipeline operational
- [ ] Frontend using only real data

### Week 3-4: MVP Features  
- [ ] 3+ scrapers operational
- [ ] Server-side filtering
- [ ] Basic admin interface
- [ ] 200+ events in database

### Month 2: Scale
- [ ] 10+ data sources
- [ ] CEU tracker MVP
- [ ] Provider submission
- [ ] Production deployment

## Next Immediate Steps 🎯

1. **Fix authentication** - Replace mock with Firebase Auth
2. **Implement Publisher** - Transform events_raw → events
3. **Fix security rules** - Allow public read on events
4. **Add 2-3 more scrapers** - RedCross, AHA, state sites
5. **Server-side filtering** - Move from client to API
6. **Basic tests** - At least for critical paths

## Success Metrics 📊

### Phase 1 Complete When:
- ✅ Real authentication working
- ✅ 200+ live events from 3+ sources
- ✅ Frontend filters work with real data
- ✅ No mock data or fallbacks
- ✅ Basic security in place

### Quality Metrics:
- Scraper success rate >95%
- API response time <200ms
- Zero critical security issues
- <5% duplicate events

## Development Tips

### Local Development Flow
```bash
# Terminal 1: Emulators
cd scrapers
firebase emulators:start --only functions,firestore --project ems-ceu-library

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Test scrapers
cd scrapers
python test_emulator.py
```

### Common Issues & Fixes
- **Firestore connection fails**: Check emulator is running
- **Auth not working**: Ensure Firebase client SDK is configured
- **TypeScript errors**: Run `npm run build` to check before deploy
- **Scraper fails**: Check network, increase timeout

---

*This roadmap reflects the actual state of the codebase as of December 2024. Focus is on making existing components production-ready before adding new features.*
