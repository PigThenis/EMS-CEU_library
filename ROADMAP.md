# EMS-CEU Library Project Roadmap

## Project Overview
A comprehensive platform for Emergency Medical Services professionals to discover, track, and manage continuing education opportunities across multiple providers.

## Current Status ✅
- [x] Firebase infrastructure setup (Auth, Firestore, Functions, Storage)
- [x] NAEMT scraper functional and tested
- [x] Basic frontend with Next.js and Tailwind CSS
- [x] Event browsing with modal details
- [x] Firebase emulator environment configured
- [x] Data pipeline from scrapers to Firestore to frontend

## Phase 1: Core Functionality 🚀

### 1.1 Additional Scrapers (Priority: HIGH)
- [ ] **American Heart Association (AHA)**
  - Location: `scrapers/sites/aha/`
  - Courses: ACLS, BLS, PALS, PEARS, Heartsaver
  - Implementation: `aha_scraper.py` extending `BaseSiteAdapter`
  - Challenge: May require handling JavaScript-heavy pages
  
- [ ] **American Red Cross**
  - Location: `scrapers/sites/redcross/`
  - Courses: First Aid, CPR, BLS, Lifeguarding
  - Implementation: `redcross_scraper.py` extending `BaseSiteAdapter`
  
- [ ] **CE Solutions**
  - Online CAPCE-accredited courses
  - Self-paced learning modules
  
- [ ] **Additional Tennessee Providers**
  - Tennessee Department of Health
  - Local hospital systems (Vanderbilt, HCA, etc.)
  - Regional EMS agencies

### 1.2 Search & Filtering (Priority: HIGH)
- [ ] **Date Range Filter**
  - Start/end date pickers
  - "Next 30/60/90 days" quick filters
  - Show only upcoming vs past events
  
- [ ] **Location-Based Filtering**
  - Geocoding integration for addresses
  - Distance radius from ZIP/city
  - State filtering
  - Border region inclusion option
  
- [ ] **Course Type Filtering**
  - Multi-select for course types
  - Category grouping (Cardiac, Trauma, Pediatric, etc.)
  - Certification level filtering (EMR, EMT, AEMT, Paramedic)
  
- [ ] **Modality Filtering**
  - In-person only
  - Virtual only
  - Hybrid options
  - Self-paced online

### 1.3 Authentication & User Management (Priority: HIGH)
- [ ] **User Registration/Login**
  - Email/password authentication
  - Google Sign-In
  - Password reset flow
  - Email verification
  
- [ングProfile Management**
  - Personal information
  - Certification details
  - Home location for distance calculations
  - Notification preferences
  
- [ ] **Protected Routes**
  - Saved events page
  - Profile settings
  - CEU tracking dashboard

## Phase 2: Enhanced Features 🎯

### 2.1 Data Enrichment
- [ ] **CEU Calculation Engine**
  - Parse CEU values from descriptions
  - Maintain lookup table for common courses
  - Provider-specific CEU rules
  - CAPCE vs state CEU differentiation
  
- [ ] **Geocoding Service**
  - Convert addresses to coordinates
  - Calculate distances
  - Regional grouping
  
- [ ] **Event Deduplication**
  - Identify same events from multiple sources
  - Merge duplicate information
  - Track primary source

### 2.2 User Features
- [ ] **Event Management**
  - Save/bookmark events
  - Add to calendar (ICS export)
  - Share events
  - Registration status tracking
  
- [ ] **CEU Tracking**
  - Track completed courses
  - Upload certificates
  - Progress towards requirements
  - Renewal reminders
  
- [ ] **Personalized Recommendations**
  - Based on certification level
  - Based on location
  - Based on past completions
  - Based on upcoming expirations

### 2.3 Notifications
- [ ] **Email Notifications**
  - New courses matching criteria
  - Registration deadlines
  - Price changes
  - Cancellations
  
- [ ] **In-App Notifications**
  - Real-time updates
  - System announcements
  - Scraper status updates

## Phase 3: Advanced Features 🔮

### 3.1 Admin Dashboard
- [ ] **Scraper Management**
  - Monitor scraper health
  - View error logs
  - Manual trigger interface
  - Success rate metrics
  
- [ ] **Content Moderation**
  - Review flagged events
  - Manual event entry
  - Bulk operations
  - Provider management
  
- [ ] **Analytics**
  - Popular courses
  - User engagement metrics
  - Geographic distribution
  - Provider comparison

### 3.2 Automation
- [ ] **Scheduled Scraping**
  - Daily/weekly schedules per provider
  - Retry logic for failures
  - Change detection
  - Alert on significant changes
  
- [ ] **Smart Scheduling**
  - Avoid rate limiting
  - Distribute load
  - Priority-based scraping

### 3.3 Mobile Experience
- [ ] **Progressive Web App**
  - Offline capability
  - Push notifications
  - App-like experience
  
- [ ] **Native Mobile Apps**
  - React Native implementation
  - iOS and Android support
  - Native features integration

## Phase 4: Monetization & Sustainability 💰

### 4.1 Revenue Models
- [ ] **Freemium Features**
  - Basic: 5 saved events
  - Premium: Unlimited saves, notifications, CEU tracking
  
- [ ] **Provider Partnerships**
  - Featured listings
  - Priority placement
  - Analytics access
  
- [ ] **Institutional Licenses**
  - EMS agency subscriptions
  - Bulk user management
  - Custom reporting

### 4.2 Community Features
- [ ] **Reviews & Ratings**
  - Course reviews
  - Instructor ratings
  - Difficulty indicators
  
- [ ] **Discussion Forums**
  - Course-specific discussions
  - Study groups
  - Resource sharing
  
- [ ] **Learning Paths**
  - Curated course sequences
  - Career progression guides
  - Specialty certifications

## Technical Debt & Improvements 🔧

### Infrastructure
- [ ] Error handling improvements
- [ ] Logging and monitoring setup
- [ ] Performance optimization
- [ ] Security audit
- [ ] Test coverage increase

### Code Quality
- [ ] TypeScript strict mode
- [ ] Component testing
- [ ] API documentation
- [ ] Code style guide
- [ ] Accessibility (WCAG 2.1 AA)

### DevOps
- [ ] CI/CD pipeline
- [ ] Automated testing
- [ ] Staging environment
- [ ] Production deployment strategy
- [ ] Backup and recovery procedures

## Success Metrics 📊

### User Metrics
- Active users (DAU/MAU)
- Events saved per user
- Search-to-save conversion rate
- User retention rate

### Data Metrics
- Number of events scraped
- Provider coverage
- Data freshness
- Scraper reliability

### Business Metrics
- User acquisition cost
- Premium conversion rate
- Provider partnerships
- Revenue per user

## Timeline Estimates 📅

**Phase 1**: 4-6 weeks
- Additional scrapers: 2 weeks
- Search & filtering: 1 week
- Authentication: 1-2 weeks

**Phase 2**: 6-8 weeks
- Data enrichment: 2 weeks
- User features: 3 weeks
- Notifications: 1-2 weeks

**Phase 3**: 8-10 weeks
- Admin dashboard: 3 weeks
- Automation: 2 weeks
- Mobile experience: 3-5 weeks

**Phase 4**: Ongoing
- Based on user feedback and metrics

## Next Immediate Steps 🎯
1. Implement functional filtering (THIS SESSION)
2. Add AHA scraper
3. Implement user authentication
4. Add geocoding for distance-based search

---

*Last Updated: August 25, 2024*
*Version: 1.0*
