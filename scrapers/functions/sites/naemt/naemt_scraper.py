"""
NAEMT (National Association of Emergency Medical Technicians) Scraper
Scrapes courses from https://naemt.org/education/CourseDirectory
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../common'))

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import Dict, List
from base_adapter import BaseSiteAdapter

class NAEMTScraper(BaseSiteAdapter):
    """Scraper for NAEMT course directory"""
    
    def __init__(self):
        super().__init__("naemt", "https://naemt.org")
    
    def scrape(self, session: requests.Session, max_pages: int, timeout: int) -> List[Dict]:
        """Scrape NAEMT course directory - handles ASP.NET pagination"""
        events = []
        
        try:
            # NAEMT course directory URL
            url = "https://naemt.org/education/CourseDirectory"
            current_page = 1
            
            # Initial request to get the first page
            print(f"🌐 Fetching {url} - Page {current_page}")
            response = session.get(url, timeout=timeout)
            response.raise_for_status()
            
            while current_page <= max_pages:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract events from current page
                page_events = self._extract_events_from_page(soup, url)
                events.extend(page_events)
                print(f"  📋 Found {len(page_events)} events on page {current_page}")
                
                # Check if there's a next page
                next_page_link = None
                pager_links = soup.select('a[href*="__doPostBack"]')
                
                for link in pager_links:
                    # Look for page number that's current_page + 1
                    if link.get_text().strip() == str(current_page + 1):
                        next_page_link = link
                        break
                
                if not next_page_link or current_page >= 10:  # Safety limit of 10 pages
                    print(f"  ✅ Reached last page or page limit (page {current_page})")
                    break
                
                # Try to get next page using form data
                # Extract ASP.NET ViewState and other form fields
                viewstate = soup.find('input', {'name': '__VIEWSTATE'})
                viewstate_generator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
                event_validation = soup.find('input', {'name': '__EVENTVALIDATION'})
                
                if viewstate and viewstate_generator:
                    # Extract the postback target from the next page link
                    href = next_page_link.get('href', '')
                    # Parse the __doPostBack parameters
                    import re
                    postback_match = re.search(r"__doPostBack\('([^']+)'(?:,'([^']*)')?\)", href)
                    
                    if postback_match:
                        event_target = postback_match.group(1)
                        event_argument = postback_match.group(2) or ''
                        
                        # Prepare form data for postback
                        form_data = {
                            '__EVENTTARGET': event_target,
                            '__EVENTARGUMENT': event_argument,
                            '__VIEWSTATE': viewstate.get('value', ''),
                            '__VIEWSTATEGENERATOR': viewstate_generator.get('value', ''),
                        }
                        
                        if event_validation:
                            form_data['__EVENTVALIDATION'] = event_validation.get('value', '')
                        
                        # Add other form fields that might be needed
                        # Look for any RadGrid specific hidden fields
                        for hidden in soup.find_all('input', type='hidden'):
                            name = hidden.get('name', '')
                            if name and name not in form_data:
                                form_data[name] = hidden.get('value', '')
                        
                        current_page += 1
                        print(f"🌐 Fetching page {current_page}...")
                        
                        try:
                            response = session.post(url, data=form_data, timeout=timeout)
                            response.raise_for_status()
                        except Exception as e:
                            print(f"  ⚠️ Could not fetch page {current_page}: {e}")
                            break
                    else:
                        print(f"  ℹ️ Could not parse pagination link, stopping at page {current_page}")
                        break
                else:
                    print(f"  ℹ️ No ASP.NET form data found, stopping at page {current_page}")
                    break
                    
        except Exception as e:
            print(f"❌ Error scraping NAEMT: {e}")
        
        print(f"✨ Total events scraped: {len(events)}")
        return events
    
    def _extract_events_from_page(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        """Extract events from a single page of results"""
        events = []
            
        # Find course listings - NAEMT uses table.rgMasterTable
        course_tables = soup.select('table.rgMasterTable')
        
        for table in course_tables:
            rows = table.select('tr')
            
            for row in rows:
                cells = row.select('td')
                # NAEMT table structure: [View Details, Program Type, Course Type, Coord. Name, Start Date, End Date, Open To Public, City, US State, Country, Distance]
                if len(cells) >= 8:
                    # Skip filter rows - look for actual course data
                    program_type = self.clean_text(cells[1].get_text())
                    course_type = self.clean_text(cells[2].get_text())
                    start_date = self.clean_text(cells[4].get_text())
                    
                    # Valid data rows have actual program types and dates
                    if program_type and course_type and start_date and len(start_date) < 20:
                        # Extract course detail link from first cell
                        course_url = base_url
                        view_details_link = cells[0].find('a')
                        if view_details_link and view_details_link.get('href'):
                            course_url = urljoin('https://naemt.org/education/', view_details_link.get('href'))
                        
                        event = {
                            'title': f"{program_type} - {course_type}",
                            'date': self.extract_date(start_date),
                            'end_date': self.extract_date(cells[5].get_text()),
                            'location': f"{self.clean_text(cells[7].get_text())}, {self.clean_text(cells[8].get_text())}",
                            'instructor': self.clean_text(cells[3].get_text()),
                            'course_type': program_type,
                            'open_to_public': self.clean_text(cells[6].get_text()),
                            'provider': 'NAEMT',
                            'source_url': course_url
                        }
                        
                        if event['title'] and event['date']:
                            events.append(event)
        
        return events
