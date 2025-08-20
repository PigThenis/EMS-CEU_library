"""
Scraper Registry - Central registry for all site scrapers
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'sites/naemt'))

from sites.naemt import NAEMTScraper

# Registry of all available scrapers
SCRAPERS = {
    'naemt': NAEMTScraper,
    # 'redcross': RedCrossScraper,  # TODO: Implement
    # 'aha': AHAScraper,            # TODO: Implement
}

def get_scraper(site_name: str):
    """Get scraper instance for a site"""
    scraper_class = SCRAPERS.get(site_name)
    if scraper_class:
        return scraper_class()
    return None

def list_available_sites():
    """List all available site scrapers"""
    return list(SCRAPERS.keys())

def get_working_sites():
    """Get list of currently working scrapers"""
    # For now, only NAEMT is fully working
    return ['naemt']