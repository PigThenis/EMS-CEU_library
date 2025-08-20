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
        """Scrape NAEMT course directory"""
        events = []
        
        try:
            # NAEMT course directory URL
            url = "https://naemt.org/education/CourseDirectory"
            print(f"🌐 Fetching {url}")
            
            response = session.get(url, timeout=timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
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
                            course_url = 'https://naemt.org/education/CourseDirectory'
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
                                
        except Exception as e:
            print(f"❌ Error scraping NAEMT: {e}")
        
        return events