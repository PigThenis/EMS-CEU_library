"""
Base adapter class for all site scrapers
"""

import re
from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse
import requests

class BaseSiteAdapter:
    """Base class for site adapters"""
    
    def __init__(self, name: str, base_url: str):
        self.name = name
        self.base_url = base_url
        
    def scrape(self, session: requests.Session, max_pages: int, timeout: int) -> List[Dict]:
        """Override this method in subclasses"""
        raise NotImplementedError
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        text = re.sub(r'\s+', ' ', text.strip())
        text = re.sub(r'[^\w\s\-.,():/]', '', text)
        return text[:200]  # Limit length
    
    def extract_date(self, date_str: str) -> Optional[str]:
        """Extract and normalize date from various formats"""
        if not date_str:
            return None
            
        # Common date patterns
        patterns = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # MM/DD/YYYY
            r'(\d{4})-(\d{2})-(\d{2})',      # YYYY-MM-DD
            r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', # Month DD, YYYY
            r'(\d{1,2})\s+(\w+)\s+(\d{4})',  # DD Month YYYY
        ]
        
        for pattern in patterns:
            match = re.search(pattern, date_str)
            if match:
                try:
                    groups = match.groups()
                    if len(groups) == 3:
                        if pattern == patterns[0]:  # MM/DD/YYYY
                            month, day, year = groups
                            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                        elif pattern == patterns[1]:  # YYYY-MM-DD
                            return f"{groups[0]}-{groups[1]}-{groups[2]}"
                        # Add more pattern handling as needed
                except:
                    continue
        
        return date_str  # Return original if can't parse
    
    def extract_course_type(self, title: str) -> str:
        """Extract course type from title"""
        if not title:
            return ""
        
        # Common EMS course types
        course_types = {
            'ACLS': 'Advanced Cardiac Life Support',
            'PALS': 'Pediatric Advanced Life Support',
            'BLS': 'Basic Life Support',
            'CPR': 'Cardiopulmonary Resuscitation',
            'PHTLS': 'Pre-Hospital Trauma Life Support',
            'TCCC': 'Tactical Combat Casualty Care',
            'AMLS': 'Advanced Medical Life Support',
            'NRP': 'Neonatal Resuscitation Program',
            'EVOS': 'Emergency Vehicle Operator Safety',
            'EPC': 'Education in Palliative and End-of-Life Care',
            'TECC': 'Tactical Emergency Casualty Care'
        }
        
        title_upper = title.upper()
        for code, full_name in course_types.items():
            if code in title_upper:
                return code
        
        return "OTHER"
    
    def extract_registration_link(self, element) -> Optional[str]:
        """Extract registration link from HTML element"""
        if not element:
            return None
            
        # Look for registration links
        links = element.find_all('a')
        for link in links:
            href = link.get('href', '')
            text = link.get_text().lower()
            
            if any(word in text for word in ['register', 'enroll', 'sign up', 'apply']):
                return href
            if any(word in href.lower() for word in ['register', 'enroll', 'signup']):
                return href
        
        return None