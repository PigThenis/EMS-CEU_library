# EMS Continuing Education Scraping Architecture

## Executive Summary

This document outlines a comprehensive Python-based web scraping solution for EMS continuing education events from major providers. The architecture prioritizes scalability, maintainability, and ethical scraping practices.

## Site Analysis Summary

### Target Website Characteristics

**American Heart Association (cpr.heart.org)**
- Status: Access restricted (403 error)
- Likely modern SPA with strong anti-bot measures
- Course catalog search functionality
- eLearning platform integration
- Requires authentication for course access

**NAEMT (naemt.org)**
- JavaScript-heavy dynamic site
- jQuery-based interactivity
- Course directory at `/education/CourseDirectory`
- Google Analytics tracking
- Search functionality with validation

**American Academy of Pediatrics (aap.org/nrp)**
- Hybrid static/dynamic architecture
- Requires login for course access
- New Relic monitoring (potential bot detection)
- Google Tag Manager tracking
- Structured learning platform

**Commercial Providers (CE Solutions, Safety Unlimited)**
- CAPCE accredited providers
- Online self-paced courses
- Mobile-friendly HTML5 platforms
- Customer authentication systems
- 24/7 course availability

## Recommended Architecture

### 1. Multi-Tiered Scraping Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static HTML   │    │  Light JS Sites │    │  Heavy SPA Sites│
│   (Requests +   │    │   (Playwright   │    │   (Playwright + │
│  BeautifulSoup) │    │   Lightweight)  │    │   Full Browser) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Central Queue  │
                    │   (Celery +     │
                    │    Redis)       │
                    └─────────────────┘
```

### 2. Technology Stack

**Core Libraries:**
- **Playwright 1.40+**: Primary tool for JavaScript-heavy sites
- **Requests 2.31+**: For static HTML content
- **BeautifulSoup4 4.12+**: HTML parsing
- **Scrapy 2.11+**: Large-scale crawling framework
- **aiohttp 3.9+**: Async HTTP client

**Supporting Infrastructure:**
- **Celery 5.3+**: Distributed task queue
- **Redis 5.0+**: Message broker and caching
- **Firebase Admin SDK 6.2+**: Firestore integration
- **Proxy-Rotator**: IP rotation
- **fake-useragent 1.4+**: User agent rotation

## Implementation Plan

### Phase 1: Core Scraping Engine

```python
# Example: Multi-strategy scraper factory
from enum import Enum
from abc import ABC, abstractmethod
import asyncio
from playwright.async_api import async_playwright
import requests
from bs4 import BeautifulSoup

class ScrapeStrategy(Enum):
    STATIC = "static"
    LIGHT_JS = "light_js"
    HEAVY_SPA = "heavy_spa"

class BaseScraper(ABC):
    @abstractmethod
    async def scrape(self, url: str, **kwargs):
        pass

class StaticScraper(BaseScraper):
    async def scrape(self, url: str, **kwargs):
        response = requests.get(url, headers=self.get_headers())
        soup = BeautifulSoup(response.content, 'html.parser')
        return self.parse_content(soup)

class PlaywrightScraper(BaseScraper):
    async def scrape(self, url: str, wait_for_selector=None, **kwargs):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Anti-detection measures
            await page.set_extra_http_headers({
                'User-Agent': self.get_random_user_agent()
            })
            
            await page.goto(url)
            
            if wait_for_selector:
                await page.wait_for_selector(wait_for_selector)
            
            content = await page.content()
            await browser.close()
            
            soup = BeautifulSoup(content, 'html.parser')
            return self.parse_content(soup)

class ScraperFactory:
    @staticmethod
    def create_scraper(strategy: ScrapeStrategy) -> BaseScraper:
        if strategy == ScrapeStrategy.STATIC:
            return StaticScraper()
        elif strategy in [ScrapeStrategy.LIGHT_JS, ScrapeStrategy.HEAVY_SPA]:
            return PlaywrightScraper()
        else:
            raise ValueError(f"Unknown strategy: {strategy}")
```

### Phase 2: Data Pipeline Architecture

```python
# Celery task structure
from celery import Celery
from firebase_admin import firestore
import logging

app = Celery('ems_scraper')

@app.task(bind=True, max_retries=3)
def scrape_site_task(self, site_config):
    try:
        # Site-specific scraping logic
        scraper = ScraperFactory.create_scraper(site_config['strategy'])
        events = scraper.scrape(site_config['url'], **site_config['params'])
        
        # Data validation and cleaning
        cleaned_events = validate_and_clean_events(events)
        
        # Store in Firestore
        store_events_firestore(cleaned_events, site_config['provider'])
        
        return {"status": "success", "events_count": len(cleaned_events)}
        
    except Exception as exc:
        logging.error(f"Scraping failed for {site_config['url']}: {exc}")
        self.retry(countdown=60 * (2 ** self.request.retries))

def validate_and_clean_events(events):
    required_fields = ['title', 'date', 'location', 'provider']
    cleaned = []
    
    for event in events:
        if all(field in event and event[field] for field in required_fields):
            # Standardize date format, clean text, validate URLs
            event['date'] = standardize_date(event['date'])
            event['title'] = clean_text(event['title'])
            cleaned.append(event)
    
    return cleaned
```

### Phase 3: Site-Specific Adapters

```python
# Example: AHA Course Scraper
class AHAScraper(PlaywrightScraper):
    async def scrape(self, url: str, **kwargs):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            page = await context.new_page()
            
            # Block unnecessary resources to speed up scraping
            await page.route("**/*", lambda route: 
                route.abort() if route.request.resource_type in ["image", "font"] 
                else route.continue_())
            
            await page.goto(url)
            
            # Wait for course listings to load
            await page.wait_for_selector('.course-listing', timeout=30000)
            
            # Extract course data
            courses = await page.evaluate('''
                () => {
                    return Array.from(document.querySelectorAll('.course-item')).map(item => ({
                        title: item.querySelector('.course-title')?.textContent?.trim(),
                        date: item.querySelector('.course-date')?.textContent?.trim(),
                        location: item.querySelector('.course-location')?.textContent?.trim(),
                        cost: item.querySelector('.course-cost')?.textContent?.trim(),
                        registration_url: item.querySelector('.register-link')?.href,
                        ceus: item.querySelector('.ceu-hours')?.textContent?.trim()
                    }));
                }
            ''')
            
            await browser.close()
            return courses

# Site configuration mapping
SITE_CONFIGS = {
    'aha': {
        'strategy': ScrapeStrategy.HEAVY_SPA,
        'url': 'https://cpr.heart.org/en/course-catalog-search',
        'scraper_class': AHAScraper,
        'rate_limit': 5,  # seconds between requests
        'params': {
            'wait_for_selector': '.course-listing'
        }
    },
    'naemt': {
        'strategy': ScrapeStrategy.LIGHT_JS,
        'url': 'https://naemt.org/education/CourseDirectory',
        'scraper_class': NAEMTScraper,
        'rate_limit': 3,
        'params': {}
    }
}
```

## Data Storage Strategy

### Firestore Schema

```javascript
// Collection: ems_courses
{
  course_id: "auto_generated",
  provider: "American Heart Association",
  course_type: "ACLS",
  title: "Advanced Cardiovascular Life Support",
  description: "Two-day course...",
  dates: {
    start_date: "2025-03-15T09:00:00Z",
    end_date: "2025-03-16T17:00:00Z"
  },
  location: {
    venue: "Metro Hospital Training Center",
    address: "123 Medical Drive, Dallas, TX 75201",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    coordinates: {
      lat: 32.7767,
      lng: -96.7970
    }
  },
  cost: {
    amount: 275.00,
    currency: "USD"
  },
  registration: {
    url: "https://cpr.heart.org/register/123",
    deadline: "2025-03-10T23:59:59Z",
    capacity: 20,
    spots_remaining: 8
  },
  ceus: {
    hours: 16,
    categories: ["Trauma", "Cardiology"]
  },
  metadata: {
    scraped_at: "2025-01-15T10:30:00Z",
    last_updated: "2025-01-15T10:30:00Z",
    source_url: "https://cpr.heart.org/course/123"
  }
}
```

## Rate Limiting & Ethical Scraping

### Implementation

```python
import time
import random
from typing import Dict, Optional
import asyncio

class RateLimiter:
    def __init__(self):
        self.last_request: Dict[str, float] = {}
        self.min_delays: Dict[str, float] = {
            'aha': 5.0,        # Conservative for protected sites
            'naemt': 3.0,      # Moderate for JS sites
            'ce_solutions': 2.0, # Light for commercial providers
            'default': 1.0
        }
    
    async def wait_if_needed(self, domain: str):
        min_delay = self.min_delays.get(domain, self.min_delays['default'])
        
        if domain in self.last_request:
            elapsed = time.time() - self.last_request[domain]
            if elapsed < min_delay:
                # Add random jitter to avoid detection
                wait_time = min_delay - elapsed + random.uniform(0.5, 2.0)
                await asyncio.sleep(wait_time)
        
        self.last_request[domain] = time.time()

class ProxyRotator:
    def __init__(self, proxy_list: list):
        self.proxies = proxy_list
        self.current_index = 0
        self.failed_proxies = set()
    
    def get_next_proxy(self) -> Optional[str]:
        available_proxies = [p for p in self.proxies if p not in self.failed_proxies]
        if not available_proxies:
            return None
        
        proxy = available_proxies[self.current_index % len(available_proxies)]
        self.current_index += 1
        return proxy
    
    def mark_failed(self, proxy: str):
        self.failed_proxies.add(proxy)
```

### Ethical Guidelines

1. **Respect robots.txt**: Always check and comply with robots.txt directives
2. **Rate limiting**: Never exceed 1 request per second per domain
3. **User-Agent rotation**: Use realistic, rotating user agents
4. **Business hours**: Schedule heavy scraping during off-peak hours
5. **Error handling**: Implement exponential backoff for failures
6. **Data usage**: Only collect publicly available course information
7. **Caching**: Cache results to minimize duplicate requests

## Monitoring & Maintenance

### Health Monitoring

```python
from dataclasses import dataclass
from datetime import datetime
import logging

@dataclass
class ScrapingMetrics:
    site: str
    start_time: datetime
    end_time: datetime
    events_scraped: int
    errors: int
    success_rate: float

class MonitoringService:
    def __init__(self):
        self.metrics_store = []
        self.alert_thresholds = {
            'success_rate': 0.85,
            'response_time': 30.0  # seconds
        }
    
    def log_scraping_session(self, metrics: ScrapingMetrics):
        self.metrics_store.append(metrics)
        
        # Check for alerts
        if metrics.success_rate < self.alert_thresholds['success_rate']:
            self.send_alert(f"Low success rate for {metrics.site}: {metrics.success_rate}")
    
    def send_alert(self, message: str):
        # Integration with monitoring services
        logging.critical(f"ALERT: {message}")

# Automated maintenance tasks
@app.task
def daily_health_check():
    """Run daily checks on scraper health"""
    # Check proxy availability
    # Validate site accessibility
    # Clean up old data
    # Generate performance reports
    pass

@app.task
def weekly_site_analysis():
    """Weekly analysis of target sites for changes"""
    # Check for HTML structure changes
    # Validate selectors still work
    # Update site configurations if needed
    pass
```

## Scaling Considerations

### Horizontal Scaling Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Scraper Node 1 │    │  Scraper Node 2 │    │  Scraper Node N │
│   (Static HTML) │    │ (Light JS Sites)│    │ (Heavy SPAs)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │  Redis Cluster  │
                    │ (Task Queue +   │
                    │    Cache)       │
                    └─────────────────┘
                                │
                    ┌─────────────────┐
                    │   Firestore     │
                    │   (Data Store)  │
                    └─────────────────┘
```

### Performance Optimization

1. **Async Processing**: Use asyncio for I/O-bound operations
2. **Connection Pooling**: Reuse HTTP connections
3. **Selective Scraping**: Only scrape changed content
4. **Resource Blocking**: Block images, fonts, ads during scraping
5. **Parallel Processing**: Run multiple scrapers concurrently
6. **Smart Scheduling**: Prioritize high-value sites

## Alternative Technologies

While Python is recommended for this use case, consider these alternatives for specific scenarios:

1. **Node.js + Puppeteer**: Better for heavy JavaScript sites, but less mature ecosystem
2. **Go + Colly**: Superior performance for static sites, but steeper learning curve
3. **Scrapy Cloud**: SaaS solution for managed scraping infrastructure

## Deployment & Operations

### Docker Configuration

```dockerfile
FROM python:3.11-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium

COPY . .
CMD ["celery", "worker", "-A", "ems_scraper", "--loglevel=info"]
```

### Production Checklist

- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Implement automated failover
- [ ] Set up data backup procedures
- [ ] Configure security scanning
- [ ] Implement rate limiting
- [ ] Set up proxy rotation
- [ ] Create maintenance runbooks

This architecture provides a robust, scalable foundation for scraping EMS continuing education events while maintaining ethical practices and minimizing maintenance overhead.