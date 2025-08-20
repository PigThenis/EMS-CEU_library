#!/usr/bin/env python3
"""
EMS Continuing Education Scraping Implementation Examples
========================================================

Complete working examples for scraping EMS CE events from major providers.
"""

import asyncio
import time
import random
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any
import json

# Third-party imports
import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Browser, Page
from fake_useragent import UserAgent
import firebase_admin
from firebase_admin import credentials, firestore
from celery import Celery
import redis

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery('ems_scraper')
celery_app.config_from_object({
    'broker_url': 'redis://localhost:6379/0',
    'result_backend': 'redis://localhost:6379/0',
    'task_serializer': 'json',
    'accept_content': ['json'],
    'result_serializer': 'json',
    'timezone': 'UTC',
    'enable_utc': True,
})

# Data Models
@dataclass
class EMSCourse:
    """Data model for EMS continuing education courses"""
    provider: str
    course_type: str
    title: str
    description: str = ""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    venue: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    cost: Optional[float] = None
    currency: str = "USD"
    registration_url: str = ""
    registration_deadline: Optional[datetime] = None
    capacity: Optional[int] = None
    spots_remaining: Optional[int] = None
    ceu_hours: Optional[float] = None
    ceu_categories: List[str] = None
    scraped_at: datetime = None
    source_url: str = ""
    
    def __post_init__(self):
        if self.scraped_at is None:
            self.scraped_at = datetime.utcnow()
        if self.ceu_categories is None:
            self.ceu_categories = []

class ScrapeStrategy(Enum):
    """Enumeration of scraping strategies"""
    STATIC = "static"
    LIGHT_JS = "light_js"
    HEAVY_SPA = "heavy_spa"

# Base Classes
class BaseScraper(ABC):
    """Abstract base class for all scrapers"""
    
    def __init__(self):
        self.ua = UserAgent()
        self.session = requests.Session()
        self.rate_limiter = RateLimiter()
    
    @abstractmethod
    async def scrape(self, url: str, **kwargs) -> List[EMSCourse]:
        """Scrape courses from the given URL"""
        pass
    
    def get_headers(self) -> Dict[str, str]:
        """Generate realistic HTTP headers"""
        return {
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        return ' '.join(text.strip().split())
    
    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse various date formats"""
        if not date_str:
            return None
        
        date_formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%B %d, %Y',
            '%b %d, %Y',
            '%Y-%m-%d %H:%M:%S',
            '%m/%d/%Y %I:%M %p'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None

class RateLimiter:
    """Rate limiting utility to prevent overwhelming servers"""
    
    def __init__(self):
        self.last_request: Dict[str, float] = {}
        self.min_delays: Dict[str, float] = {
            'cpr.heart.org': 5.0,
            'naemt.org': 3.0,
            'aap.org': 4.0,
            'ems-ce.com': 2.0,
            'safetyunlimited.com': 2.0,
            'default': 1.5
        }
    
    async def wait_if_needed(self, domain: str):
        """Wait before making request if needed to respect rate limits"""
        min_delay = self.min_delays.get(domain, self.min_delays['default'])
        
        if domain in self.last_request:
            elapsed = time.time() - self.last_request[domain]
            if elapsed < min_delay:
                wait_time = min_delay - elapsed + random.uniform(0.5, 1.5)
                logger.info(f"Rate limiting: waiting {wait_time:.2f}s for {domain}")
                await asyncio.sleep(wait_time)
        
        self.last_request[domain] = time.time()

# Concrete Scraper Implementations
class StaticScraper(BaseScraper):
    """Scraper for static HTML content"""
    
    async def scrape(self, url: str, **kwargs) -> List[EMSCourse]:
        """Scrape static HTML sites using requests + BeautifulSoup"""
        domain = url.split('/')[2]
        await self.rate_limiter.wait_if_needed(domain)
        
        try:
            response = self.session.get(url, headers=self.get_headers(), timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            return self.parse_content(soup, url)
            
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return []
    
    def parse_content(self, soup: BeautifulSoup, url: str) -> List[EMSCourse]:
        """Parse content - to be overridden by specific implementations"""
        return []

class PlaywrightScraper(BaseScraper):
    """Scraper for JavaScript-heavy sites using Playwright"""
    
    def __init__(self):
        super().__init__()
        self.browser: Optional[Browser] = None
    
    async def scrape(self, url: str, wait_for_selector: str = None, **kwargs) -> List[EMSCourse]:
        """Scrape JavaScript sites using Playwright"""
        domain = url.split('/')[2]
        await self.rate_limiter.wait_if_needed(domain)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            
            context = await browser.new_context(
                user_agent=self.ua.random,
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            # Block unnecessary resources for faster scraping
            await page.route("**/*", lambda route: 
                route.abort() if route.request.resource_type in ["image", "font", "media"] 
                else route.continue_())
            
            try:
                await page.goto(url, wait_until='networkidle', timeout=60000)
                
                if wait_for_selector:
                    await page.wait_for_selector(wait_for_selector, timeout=30000)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                courses = self.parse_content(soup, url)
                
                # Additional JavaScript-based extraction if needed
                if hasattr(self, 'extract_js_data'):
                    js_courses = await self.extract_js_data(page)
                    courses.extend(js_courses)
                
                return courses
                
            except Exception as e:
                logger.error(f"Error scraping {url} with Playwright: {e}")
                return []
            finally:
                await browser.close()

# Site-Specific Scrapers
class AHAScraper(PlaywrightScraper):
    """Scraper for American Heart Association courses"""
    
    async def extract_js_data(self, page: Page) -> List[EMSCourse]:
        """Extract course data using JavaScript execution"""
        try:
            # Wait for course listings to load
            await page.wait_for_selector('.course-listing, .search-results', timeout=30000)
            
            # Execute JavaScript to extract course data
            courses_data = await page.evaluate('''
                () => {
                    const courses = [];
                    const courseElements = document.querySelectorAll('.course-item, .course-card');
                    
                    courseElements.forEach(element => {
                        const titleEl = element.querySelector('.course-title, .title, h3, h4');
                        const dateEl = element.querySelector('.course-date, .date, .when');
                        const locationEl = element.querySelector('.course-location, .location, .where');
                        const costEl = element.querySelector('.course-cost, .cost, .price');
                        const linkEl = element.querySelector('a[href*="register"], .register-link');
                        const ceuEl = element.querySelector('.ceu, .hours, .credit');
                        
                        if (titleEl && titleEl.textContent.trim()) {
                            courses.push({
                                title: titleEl.textContent.trim(),
                                date: dateEl ? dateEl.textContent.trim() : '',
                                location: locationEl ? locationEl.textContent.trim() : '',
                                cost: costEl ? costEl.textContent.trim() : '',
                                registration_url: linkEl ? linkEl.href : '',
                                ceu_hours: ceuEl ? ceuEl.textContent.trim() : ''
                            });
                        }
                    });
                    
                    return courses;
                }
            ''')
            
            return [self._convert_to_ems_course(course_data, 'American Heart Association') 
                   for course_data in courses_data]
        
        except Exception as e:
            logger.error(f"Error extracting JS data from AHA: {e}")
            return []
    
    def _convert_to_ems_course(self, data: Dict, provider: str) -> EMSCourse:
        """Convert scraped data to EMSCourse object"""
        return EMSCourse(
            provider=provider,
            course_type=self._extract_course_type(data.get('title', '')),
            title=self.clean_text(data.get('title', '')),
            start_date=self.parse_date(data.get('date', '')),
            venue=self.clean_text(data.get('location', '')),
            cost=self._extract_cost(data.get('cost', '')),
            registration_url=data.get('registration_url', ''),
            ceu_hours=self._extract_ceu_hours(data.get('ceu_hours', '')),
            source_url=data.get('source_url', '')
        )
    
    def _extract_course_type(self, title: str) -> str:
        """Extract course type from title"""
        title_upper = title.upper()
        if 'ACLS' in title_upper:
            return 'ACLS'
        elif 'PALS' in title_upper:
            return 'PALS'
        elif 'BLS' in title_upper:
            return 'BLS'
        elif 'CPR' in title_upper:
            return 'CPR'
        return 'Other'
    
    def _extract_cost(self, cost_str: str) -> Optional[float]:
        """Extract numeric cost from string"""
        if not cost_str:
            return None
        
        import re
        cost_match = re.search(r'\$?(\d+(?:\.\d{2})?)', cost_str.replace(',', ''))
        return float(cost_match.group(1)) if cost_match else None
    
    def _extract_ceu_hours(self, ceu_str: str) -> Optional[float]:
        """Extract CEU hours from string"""
        if not ceu_str:
            return None
        
        import re
        hours_match = re.search(r'(\d+(?:\.\d+)?)', ceu_str)
        return float(hours_match.group(1)) if hours_match else None

class NAEMTScraper(PlaywrightScraper):
    """Scraper for NAEMT courses (PHTLS, AMLS)"""
    
    async def extract_js_data(self, page: Page) -> List[EMSCourse]:
        """Extract NAEMT course data"""
        try:
            # Navigate to course directory
            await page.goto('https://naemt.org/education/CourseDirectory')
            await page.wait_for_selector('.course-directory, .course-list', timeout=30000)
            
            # Extract course information
            courses_data = await page.evaluate('''
                () => {
                    const courses = [];
                    const courseElements = document.querySelectorAll('.course-item, tr[class*="course"]');
                    
                    courseElements.forEach(element => {
                        const titleEl = element.querySelector('td:first-child, .course-name');
                        const dateEl = element.querySelector('td:nth-child(2), .course-date');
                        const locationEl = element.querySelector('td:nth-child(3), .course-location');
                        const instructorEl = element.querySelector('td:nth-child(4), .instructor');
                        const contactEl = element.querySelector('td:nth-child(5), .contact');
                        
                        if (titleEl && titleEl.textContent.trim()) {
                            courses.push({
                                title: titleEl.textContent.trim(),
                                date: dateEl ? dateEl.textContent.trim() : '',
                                location: locationEl ? locationEl.textContent.trim() : '',
                                instructor: instructorEl ? instructorEl.textContent.trim() : '',
                                contact: contactEl ? contactEl.textContent.trim() : ''
                            });
                        }
                    });
                    
                    return courses;
                }
            ''')
            
            return [self._convert_to_ems_course(course_data, 'NAEMT') 
                   for course_data in courses_data]
        
        except Exception as e:
            logger.error(f"Error extracting NAEMT courses: {e}")
            return []
    
    def _convert_to_ems_course(self, data: Dict, provider: str) -> EMSCourse:
        """Convert NAEMT data to EMSCourse object"""
        course_title = data.get('title', '')
        return EMSCourse(
            provider=provider,
            course_type=self._extract_naemt_course_type(course_title),
            title=self.clean_text(course_title),
            start_date=self.parse_date(data.get('date', '')),
            venue=self.clean_text(data.get('location', '')),
            description=f"Instructor: {data.get('instructor', '')}",
            source_url='https://naemt.org/education/CourseDirectory'
        )
    
    def _extract_naemt_course_type(self, title: str) -> str:
        """Extract NAEMT course type"""
        title_upper = title.upper()
        if 'PHTLS' in title_upper:
            return 'PHTLS'
        elif 'AMLS' in title_upper:
            return 'AMLS'
        elif 'EPC' in title_upper:
            return 'EPC'
        elif 'TCCC' in title_upper:
            return 'TCCC'
        return 'Other'

class CESolutionsScraper(StaticScraper):
    """Scraper for CE Solutions courses"""
    
    async def scrape(self, url: str = "https://www.ems-ce.com/ems/", **kwargs) -> List[EMSCourse]:
        """Scrape CE Solutions course catalog"""
        courses = await super().scrape(url, **kwargs)
        return courses
    
    def parse_content(self, soup: BeautifulSoup, url: str) -> List[EMSCourse]:
        """Parse CE Solutions course content"""
        courses = []
        
        # Look for course listings
        course_elements = soup.find_all(['div', 'tr'], class_=lambda x: x and 'course' in x.lower())
        
        for element in course_elements:
            title_el = element.find(['h3', 'h4', 'strong', 'a'])
            if not title_el:
                continue
            
            title = self.clean_text(title_el.get_text())
            if not title:
                continue
            
            course = EMSCourse(
                provider='CE Solutions',
                course_type='Online CE',
                title=title,
                description=self._extract_description(element),
                ceu_hours=self._extract_hours(element),
                registration_url=self._extract_registration_url(element, url),
                source_url=url
            )
            
            courses.append(course)
        
        return courses
    
    def _extract_description(self, element) -> str:
        """Extract course description"""
        desc_el = element.find(['p', 'div'], class_=lambda x: x and 'desc' in x.lower() if x else False)
        return self.clean_text(desc_el.get_text()) if desc_el else ""
    
    def _extract_hours(self, element) -> Optional[float]:
        """Extract CEU hours"""
        text = element.get_text()
        import re
        hours_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|ceu)', text, re.IGNORECASE)
        return float(hours_match.group(1)) if hours_match else None
    
    def _extract_registration_url(self, element, base_url: str) -> str:
        """Extract registration URL"""
        link_el = element.find('a', href=True)
        if link_el:
            href = link_el['href']
            if href.startswith('http'):
                return href
            elif href.startswith('/'):
                return f"https://www.ems-ce.com{href}"
        return ""

# Scraper Factory
class ScraperFactory:
    """Factory for creating appropriate scrapers"""
    
    @staticmethod
    def create_scraper(strategy: ScrapeStrategy, site: str = None) -> BaseScraper:
        """Create scraper based on strategy and site"""
        if site == 'aha':
            return AHAScraper()
        elif site == 'naemt':
            return NAEMTScraper()
        elif site == 'ce_solutions':
            return CESolutionsScraper()
        elif strategy == ScrapeStrategy.STATIC:
            return StaticScraper()
        elif strategy in [ScrapeStrategy.LIGHT_JS, ScrapeStrategy.HEAVY_SPA]:
            return PlaywrightScraper()
        else:
            raise ValueError(f"Unknown strategy: {strategy}")

# Firebase Integration
class FirestoreService:
    """Service for storing course data in Firestore"""
    
    def __init__(self, credentials_path: str = None):
        if not firebase_admin._apps:
            if credentials_path:
                cred = credentials.Certificate(credentials_path)
                firebase_admin.initialize_app(cred)
            else:
                # Use default credentials
                firebase_admin.initialize_app()
        
        self.db = firestore.client()
        self.collection = 'ems_courses'
    
    def store_courses(self, courses: List[EMSCourse], batch_size: int = 500):
        """Store courses in Firestore with batch writes"""
        if not courses:
            return
        
        # Process in batches
        for i in range(0, len(courses), batch_size):
            batch = self.db.batch()
            batch_courses = courses[i:i + batch_size]
            
            for course in batch_courses:
                doc_ref = self.db.collection(self.collection).document()
                course_dict = asdict(course)
                
                # Convert datetime objects to Firestore timestamps
                for key, value in course_dict.items():
                    if isinstance(value, datetime):
                        course_dict[key] = value
                
                batch.set(doc_ref, course_dict)
            
            try:
                batch.commit()
                logger.info(f"Stored batch of {len(batch_courses)} courses")
            except Exception as e:
                logger.error(f"Error storing batch: {e}")
    
    def get_existing_courses(self, provider: str, days_back: int = 7) -> List[Dict]:
        """Get existing courses to avoid duplicates"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        
        query = (self.db.collection(self.collection)
                .where('provider', '==', provider)
                .where('scraped_at', '>=', cutoff_date))
        
        return [doc.to_dict() for doc in query.stream()]

# Celery Tasks
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def scrape_site_task(self, site_config: Dict) -> Dict[str, Any]:
    """Celery task for scraping a specific site"""
    try:
        # Create scraper
        scraper = ScraperFactory.create_scraper(
            ScrapeStrategy(site_config['strategy']),
            site_config.get('site_name')
        )
        
        # Scrape courses
        courses = asyncio.run(scraper.scrape(
            site_config['url'],
            **site_config.get('params', {})
        ))
        
        if not courses:
            logger.warning(f"No courses found for {site_config['url']}")
            return {"status": "success", "events_count": 0}
        
        # Store in Firestore
        firestore_service = FirestoreService()
        firestore_service.store_courses(courses)
        
        logger.info(f"Successfully scraped {len(courses)} courses from {site_config['url']}")
        
        return {
            "status": "success",
            "events_count": len(courses),
            "provider": site_config.get('provider', 'Unknown')
        }
        
    except Exception as exc:
        logger.error(f"Scraping failed for {site_config['url']}: {exc}")
        self.retry(countdown=60 * (2 ** self.request.retries))

@celery_app.task
def schedule_all_scraping():
    """Schedule scraping for all configured sites"""
    site_configs = [
        {
            'site_name': 'aha',
            'strategy': 'heavy_spa',
            'url': 'https://cpr.heart.org/en/course-catalog-search',
            'provider': 'American Heart Association',
            'params': {'wait_for_selector': '.course-listing'}
        },
        {
            'site_name': 'naemt',
            'strategy': 'light_js',
            'url': 'https://naemt.org/education/CourseDirectory',
            'provider': 'NAEMT',
            'params': {}
        },
        {
            'site_name': 'ce_solutions',
            'strategy': 'static',
            'url': 'https://www.ems-ce.com/ems/',
            'provider': 'CE Solutions',
            'params': {}
        }
    ]
    
    results = []
    for config in site_configs:
        result = scrape_site_task.delay(config)
        results.append(result.id)
    
    return {"scheduled_tasks": results}

# Command Line Interface
def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='EMS Course Scraper')
    parser.add_argument('--site', choices=['aha', 'naemt', 'ce_solutions', 'all'],
                       default='all', help='Site to scrape')
    parser.add_argument('--output', help='Output file for scraped data')
    parser.add_argument('--firestore', action='store_true',
                       help='Store results in Firestore')
    
    args = parser.parse_args()
    
    if args.site == 'all':
        # Schedule all scraping tasks
        schedule_all_scraping.delay()
        print("Scheduled scraping tasks for all sites")
    else:
        # Run single site scraping
        site_configs = {
            'aha': {
                'strategy': 'heavy_spa',
                'url': 'https://cpr.heart.org/en/course-catalog-search',
                'site_name': 'aha'
            },
            'naemt': {
                'strategy': 'light_js',
                'url': 'https://naemt.org/education/CourseDirectory',
                'site_name': 'naemt'
            },
            'ce_solutions': {
                'strategy': 'static',
                'url': 'https://www.ems-ce.com/ems/',
                'site_name': 'ce_solutions'
            }
        }
        
        config = site_configs[args.site]
        result = scrape_site_task.delay(config)
        print(f"Scheduled scraping task: {result.id}")

if __name__ == "__main__":
    main()