'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { ConfigStatus } from '@/components/ConfigStatus';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface ScraperStatus {
  isRunning: boolean;
  lastRun?: string;
  eventCount?: number;
  error?: string;
}

interface ScraperLog {
  id: string;
  timestamp: string;
  status: 'running' | 'success' | 'error';
  message: string;
  eventCount?: number;
  duration?: number;
}

export default function ScraperAdminPage() {
  const [status, setStatus] = useState<ScraperStatus>({ isRunning: false });
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [selectedScraper, setSelectedScraper] = useState('naemt');
  const [loading, setLoading] = useState(false);
  const [eventStats, setEventStats] = useState({ total: 0, today: 0, thisWeek: 0 });

  // Available scrapers
  const scrapers = [
    { id: 'naemt', name: 'NAEMT', description: 'National Association of Emergency Medical Technicians' },
    { id: 'redcross', name: 'Red Cross', description: 'American Red Cross (Coming Soon)', disabled: true },
    { id: 'aha', name: 'AHA', description: 'American Heart Association (Coming Soon)', disabled: true },
  ];

  // Listen to events_raw collection for real-time updates
  useEffect(() => {
    // Get total count from a separate query without limit
    const totalQuery = collection(db, 'events_raw');
    
    const unsubscribe = onSnapshot(totalQuery, (snapshot) => {
      const total = snapshot.size;
      
      // Calculate today's events
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const today = snapshot.docs.filter(doc => {
        const data = doc.data();
        // Handle both Firestore Timestamp and regular Date/string
        let scrapedAt;
        if (data.scraped_at?.toDate) {
          scrapedAt = data.scraped_at.toDate();
        } else if (data.scraped_at?.seconds) {
          scrapedAt = new Date(data.scraped_at.seconds * 1000);
        } else if (data.scraped_at) {
          scrapedAt = new Date(data.scraped_at);
        } else {
          return false;
        }
        return scrapedAt >= startOfToday;
      }).length;
      
      // Calculate this week's events
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeek = snapshot.docs.filter(doc => {
        const data = doc.data();
        let scrapedAt;
        if (data.scraped_at?.toDate) {
          scrapedAt = data.scraped_at.toDate();
        } else if (data.scraped_at?.seconds) {
          scrapedAt = new Date(data.scraped_at.seconds * 1000);
        } else if (data.scraped_at) {
          scrapedAt = new Date(data.scraped_at);
        } else {
          return false;
        }
        return scrapedAt >= weekAgo;
      }).length;
      
      setEventStats({ total, today, thisWeek });
    }, (error) => {
      console.error('Error listening to events:', error);
      // If there's an error (like permissions), show zeros
      setEventStats({ total: 0, today: 0, thisWeek: 0 });
    });

    return () => unsubscribe();
  }, []);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date > weekAgo;
  };

  const runScraper = async () => {
    setLoading(true);
    setStatus({ isRunning: true });
    
    const startTime = Date.now();
    const logEntry: ScraperLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'running',
      message: `Starting ${selectedScraper.toUpperCase()} scraper...`
    };
    
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]);
    
    try {
      // Determine which URL to use based on configuration
      const useScraperEmulator = process.env.NEXT_PUBLIC_USE_SCRAPER_EMULATOR === 'true';
      
      const baseUrl = useScraperEmulator
        ? 'http://localhost:5001/demo-ems-ceu-library/us-central1'  // Local emulator
        : 'https://scrapenaemt-zb4uhgzpiq-uc.a.run.app';      // Production Cloud Function
      
      const functionUrl = useScraperEmulator
        ? `${baseUrl}/scrapeNAEMT`
        : baseUrl;  // Production URL is already complete
      
      console.log(`🎯 Scraper target: ${useScraperEmulator ? 'Emulator' : 'Production'}`, functionUrl);
      
      setLogs(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], message: `Calling scraper function...` };
        return updated;
      });
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.status === 'success') {
        setStatus({
          isRunning: false,
          lastRun: new Date().toISOString(),
          eventCount: data.events_saved
        });
        
        const dedupInfo = data.deduplication 
          ? ` (${data.events_saved} new, ${data.duplicates_found} duplicates)`
          : '';
        
        setLogs(prev => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            status: 'success',
            message: `✅ Scraped ${data.total_events} events${dedupInfo}`,
            eventCount: data.events_saved,
            duration
          };
          return updated;
        });
        
        // Add deduplication details to log if available
        if (data.deduplication) {
          setLogs(prev => [
            prev[0],
            {
              id: `dedup-${Date.now()}`,
              timestamp: new Date().toISOString(),
              status: 'success',
              message: `📊 Deduplication: ${data.deduplication.duplicate_rate} were duplicates, ${data.existing_updated} existing events updated`
            },
            ...prev.slice(1)
          ]);
        }
      } else {
        throw new Error(data.error || 'Scraper failed');
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setStatus({
        isRunning: false,
        error: error.message
      });
      
      setLogs(prev => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          status: 'error',
          message: `❌ Error: ${error.message}`,
          duration
        };
        return updated;
      });
      
      console.error('Scraper error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearEvents = async () => {
    if (!confirm('Are you sure you want to clear all events? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    const logEntry: ScraperLog = {
      id: `clear-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'running',
      message: 'Clearing all events...'
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]);
    
    try {
      const response = await fetch('/api/admin/clear-events', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLogs(prev => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            status: 'success',
            message: `✅ ${data.message}`
          };
          return updated;
        });
        
        // Reset stats
        setEventStats({ total: 0, today: 0, thisWeek: 0 });
      } else {
        throw new Error(data.error || 'Failed to clear events');
      }
    } catch (error: any) {
      setLogs(prev => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          status: 'error',
          message: `❌ Error: ${error.message}`
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const startEmulators = async () => {
    alert('To start emulators, run this in terminal:\n\ncd scrapers && firebase emulators:start --only functions,firestore --project ems-ceu-library');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Scraper Admin</h1>
        <p className="mt-2 text-slate-600">Manually control scrapers and view event data</p>
      </div>

      {/* Configuration Status */}
      <ConfigStatus />
      
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm text-slate-500">Total Events</div>
          <div className="mt-2 text-3xl font-bold">{eventStats.total}</div>
          <div className="mt-1 text-xs text-slate-500">In database</div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm text-slate-500">Today's Scrapes</div>
          <div className="mt-2 text-3xl font-bold">{eventStats.today}</div>
          <div className="mt-1 text-xs text-slate-500">Events added today</div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm text-slate-500">This Week</div>
          <div className="mt-2 text-3xl font-bold">{eventStats.thisWeek}</div>
          <div className="mt-1 text-xs text-slate-500">Events added this week</div>
        </div>
      </div>

      {/* Scraper Control Panel */}
      <div className="rounded-lg border bg-white p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Scraper Control</h2>
        
        {/* Environment Check */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="font-medium">Environment: {process.env.NODE_ENV}</div>
          <div className="text-blue-700">
            {process.env.NODE_ENV === 'development' 
              ? '🔧 Development mode - Using local emulators'
              : '🚀 Production mode - Using live Firebase'
            }
          </div>
        </div>
        
        {/* Scraper Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Scraper</label>
          <select
            value={selectedScraper}
            onChange={(e) => setSelectedScraper(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            disabled={loading}
          >
            {scrapers.map(scraper => (
              <option key={scraper.id} value={scraper.id} disabled={scraper.disabled}>
                {scraper.name} {scraper.disabled ? '(Coming Soon)' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {scrapers.find(s => s.id === selectedScraper)?.description}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={runScraper}
            disabled={loading || status.isRunning}
            className="flex-1"
          >
            {loading ? 'Running Scraper...' : 'Run Scraper'}
          </Button>
          
          <Button
            variant="outline"
            onClick={clearEvents}
            disabled={loading}
          >
            Clear All Events
          </Button>
          
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              onClick={startEmulators}
              disabled={loading}
            >
              Start Emulators
            </Button>
          )}
        </div>
        
        {/* Status Display */}
        {status.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {status.error}
          </div>
        )}
        
        {status.lastRun && !status.error && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            Last run: {new Date(status.lastRun).toLocaleString()} - {status.eventCount} events
          </div>
        )}
      </div>

      {/* Activity Logs */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
        
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm">No activity yet. Run a scraper to see logs.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded text-sm ${
                  log.status === 'error'
                    ? 'bg-red-50 text-red-700'
                    : log.status === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' - '}
                    <span>{log.message}</span>
                  </div>
                  {log.duration && (
                    <span className="text-xs opacity-75">
                      {(log.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                {log.eventCount !== undefined && (
                  <div className="mt-1 text-xs opacity-75">
                    Events: {log.eventCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start Guide */}
      <div className="mt-6 rounded-lg border bg-slate-50 p-6">
        <h3 className="font-semibold mb-2">Quick Start</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
          <li>Make sure Firebase emulators are running (for development)</li>
          <li>Select NAEMT scraper (only one currently available)</li>
          <li>Click "Run Scraper" to fetch events</li>
          <li>Check the Events page to see scraped data</li>
        </ol>
        
        <div className="mt-4 p-3 bg-white rounded border">
          <div className="text-sm font-mono text-slate-700">
            # Start emulators (in terminal):<br/>
            cd scrapers<br/>
            firebase emulators:start --only functions,firestore --project ems-ceu-library
          </div>
        </div>
      </div>
    </div>
  );
}
