# EMS CEU Library

A minimal Next.js + TypeScript scaffold for an EMS continuing education hub focused on Tennessee.

What’s included
- Landing page draft with hero, featured categories, and placeholder highlights
- Onboarding flow to create a profile (Account → License → Preferences → Done)
- Placeholder API routes for registration, login, and profile storage (in-memory only)
- Events listing page with placeholder filters and cards
- Tailwind CSS with a simple brand palette

Not included yet (placeholders)
- Real authentication (email verification, password reset)
- Database (Postgres/PostGIS) and geocoding
- Events data model, scraping/ETL, filters API
- Requirements engine and AI recommendations
- Admin moderation and provider submissions

Getting started
1) Install dependencies
   - npm install
2) Run the dev server
   - npm run dev
3) Open http://localhost:3000

Project structure
- app/
  - page.tsx (landing)
  - events/page.tsx (events placeholder)
  - onboarding/page.tsx (profile flow)
  - api/
    - auth/register/route.ts
    - auth/login/route.ts
    - profile/route.ts
- components/Button.tsx
- lib/types.ts

Next steps (implementation plan)
1) Auth & accounts
   - Replace placeholder auth with NextAuth or custom JWT; add email verification and password reset.
2) Database & schema
   - Set up Postgres + PostGIS; Prisma models for User, Profile, License, Event, Provider, CEUCategory, RequirementTemplate, UserRequirement, UserCEURecord.
3) Events ingestion
   - Prototype scrapers for 3–5 sources; ETL pipeline; geocode addresses; dedupe and publish to DB.
4) API v1
   - REST endpoints for events with filters (date, duration, CEUs, categories, modality, distance, cost, course type, provider, region).
5) Frontend filters & map
   - Connect events to UI; faceted filters; distance search by ZIP/city; map (Mapbox/Leaflet).
6) Requirements engine (placeholder)
   - Create TN requirement templates per role (EMR/EMT/AEMT/Paramedic) with placeholders; compute remaining CEUs by category and total.
7) Admin tools
   - Manual review queue; source health; mapping editor.
8) Notifications
   - Saved searches and email alerts (placeholder yes; wire later).

Notes
- License number is optional. Verification is manual for now.
- Virtual/hybrid counting rules are placeholders until finalized.
- Include border-adjacent events by default.

