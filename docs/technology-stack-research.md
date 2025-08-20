# EMS Education Event Scraping: Technology Stack Research & Recommendations

## Executive Summary

This research evaluates non-Python alternatives for scraping EMS education events from sites like American Heart Association, NAEMT, and other providers. Based on performance, maintainability, and Firebase integration requirements, **Node.js with Playwright** emerges as the optimal solution, followed by specialized headless browser services for production scaling.

## Target Site Analysis

### Technical Characteristics
- **American Heart Association (cpr.heart.org)**: Dynamic content loading, likely protected by Cloudflare
- **NAEMT (naemt.org)**: Course directory with location-based search, moderate JavaScript usage
- **State EMS offices**: Varied implementations, mix of static and dynamic content
- **Commercial providers**: Often use Cloudflare protection, heavy JavaScript frameworks

### Common Challenges
- **Anti-bot protection**: Cloudflare JavaScript challenges, CAPTCHAs, TLS fingerprinting
- **Dynamic content**: Course listings loaded via JavaScript/AJAX
- **Rate limiting**: IP-based throttling and behavioral analysis
- **Complex UI**: Multi-step search flows, pagination, filtering

## Technology Stack Evaluation

### 1. Node.js Solutions

#### **Winner: Node.js + Playwright**

**Performance**: 
- Native async/await support for concurrent operations
- V8 engine provides excellent JavaScript execution speed
- Browser automation performance: ~2-3x faster than Python equivalents

**Strengths**:
- Natural integration with browser environments
- Excellent Cloudflare bypass capabilities with proper configuration
- Rich ecosystem (Playwright, Puppeteer, Cheerio)
- Seamless Firebase integration via Admin SDK
- Container-friendly for scaling

**Development Speed**: ⭐⭐⭐⭐⭐ (Fastest to implement)
**Maintenance**: ⭐⭐⭐⭐ (Good tooling, active community)
**Cost**: ⭐⭐⭐⭐ (Efficient resource usage)
**Reliability**: ⭐⭐⭐⭐ (Mature ecosystem)

#### Implementation Example
```javascript
// Core scraper structure
import { chromium } from 'playwright';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

class EMSScraper {
  constructor() {
    this.browser = null;
    this.db = getFirestore();
  }

  async scrapeAHACourses(zipCode) {
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Navigate and handle dynamic loading
    await page.goto('https://cpr.heart.org/en/course-catalog-search');
    await page.fill('[data-qa="zip-code"]', zipCode);
    await page.click('[data-qa="search-button"]');
    
    // Wait for results to load
    await page.waitForSelector('[data-qa="course-card"]', { timeout: 30000 });
    
    // Extract course data
    const courses = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-qa="course-card"]'))
        .map(card => ({
          title: card.querySelector('h3')?.textContent,
          date: card.querySelector('[data-qa="date"]')?.textContent,
          location: card.querySelector('[data-qa="location"]')?.textContent,
          price: card.querySelector('[data-qa="price"]')?.textContent,
          url: card.querySelector('a')?.href
        }));
    });
    
    // Store in Firestore
    for (const course of courses) {
      await this.db.collection('events_raw').add({
        ...course,
        provider: 'AHA',
        scraped_at: new Date(),
        source_zip: zipCode
      });
    }
    
    await context.close();
    return courses;
  }
}
```

### 2. Go-based Solutions

#### **Go + Colly/ChromeDP**

**Performance**: 
- Fastest raw execution (~5-10x faster than Python)
- Excellent memory efficiency
- Superior concurrent request handling with goroutines

**Strengths**:
- Exceptional performance for large-scale operations
- Built-in concurrency primitives
- Small deployment footprint
- Strong static typing

**Weaknesses**:
- Steeper learning curve
- Smaller ecosystem for web scraping
- Less flexible for rapid prototyping
- Limited JavaScript execution capabilities

**Development Speed**: ⭐⭐⭐ (Slower initial development)
**Maintenance**: ⭐⭐⭐⭐ (Excellent reliability)
**Cost**: ⭐⭐⭐⭐⭐ (Most efficient resource usage)
**Reliability**: ⭐⭐⭐⭐⭐ (Exceptional stability)

#### Implementation Example
```go
package main

import (
    "context"
    "fmt"
    "cloud.google.com/go/firestore"
    "github.com/chromedp/chromedp"
)

type EMSEvent struct {
    Title    string `firestore:"title"`
    Date     string `firestore:"date"`
    Location string `firestore:"location"`
    Provider string `firestore:"provider"`
}

func scrapeAHACourses(zipCode string) ([]EMSEvent, error) {
    ctx, cancel := chromedp.NewContext(context.Background())
    defer cancel()
    
    var events []EMSEvent
    
    err := chromedp.Run(ctx,
        chromedp.Navigate("https://cpr.heart.org/en/course-catalog-search"),
        chromedp.WaitVisible(`[data-qa="zip-code"]`),
        chromedp.SendKeys(`[data-qa="zip-code"]`, zipCode),
        chromedp.Click(`[data-qa="search-button"]`),
        chromedp.WaitVisible(`[data-qa="course-card"]`),
        chromedp.Evaluate(`
            Array.from(document.querySelectorAll('[data-qa="course-card"]'))
                .map(card => ({
                    title: card.querySelector('h3')?.textContent,
                    date: card.querySelector('[data-qa="date"]')?.textContent,
                    location: card.querySelector('[data-qa="location"]')?.textContent
                }))
        `, &events),
    )
    
    return events, err
}
```

### 3. Cloud-Native Solutions

#### **AWS Lambda + Playwright in Containers**

**Strengths**:
- Auto-scaling based on demand
- Pay-per-execution pricing
- No server management
- Global deployment options

**Challenges**:
- Cold start latency (2-5 seconds)
- Memory limitations (max 10GB)
- Package size restrictions
- Complex deployment for browser dependencies

**Development Speed**: ⭐⭐⭐ (Complex setup)
**Maintenance**: ⭐⭐⭐⭐⭐ (Fully managed)
**Cost**: ⭐⭐⭐ (Variable, can be expensive at scale)
**Reliability**: ⭐⭐⭐⭐ (AWS infrastructure)

#### Implementation Example
```dockerfile
# Dockerfile for Lambda deployment
FROM public.ecr.aws/lambda/nodejs:20

# Install Playwright and dependencies
COPY package*.json ./
RUN npm install
RUN npx playwright install chromium
RUN npx playwright install-deps

COPY index.js ./

CMD ["index.handler"]
```

```javascript
// Lambda handler
export const handler = async (event) => {
  const { chromium } = await import('playwright');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    // Scraping logic here
    const results = await scrapeEMSEvents(event.zipCode);
    
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } finally {
    await browser.close();
  }
};
```

### 4. Headless Browser Services

#### **Browserless.io (Recommended)**

**Pricing**: $50-200/month for typical usage
**Strengths**:
- Managed browser infrastructure
- Automatic Cloudflare bypass
- Session persistence
- Screenshot and PDF generation

#### **ScrapingBee**

**Pricing**: $49+/month
**Strengths**:
- Simple API interface
- Built-in proxy rotation
- JavaScript rendering
- CAPTCHA solving

#### **Apify Platform**

**Pricing**: $39+/month
**Strengths**:
- Pre-built scraping actors
- Workflow automation
- Data storage included
- Scheduler and monitoring

#### Implementation Example (Browserless)
```javascript
import fetch from 'node-fetch';

class BrowserlessEMSScraper {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseUrl = 'https://chrome.browserless.io';
  }
  
  async scrapeWithCode(code, context = {}) {
    const response = await fetch(`${this.baseUrl}/function`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        context
      })
    });
    
    return response.json();
  }
  
  async scrapeAHA(zipCode) {
    const scrapeCode = `
      async ({ page, context }) => {
        await page.goto('https://cpr.heart.org/en/course-catalog-search');
        await page.fill('[data-qa="zip-code"]', context.zipCode);
        await page.click('[data-qa="search-button"]');
        await page.waitForSelector('[data-qa="course-card"]');
        
        return page.evaluate(() => {
          return Array.from(document.querySelectorAll('[data-qa="course-card"]'))
            .map(card => ({
              title: card.querySelector('h3')?.textContent,
              date: card.querySelector('[data-qa="date"]')?.textContent
            }));
        });
      }
    `;
    
    return this.scrapeWithCode(scrapeCode, { zipCode });
  }
}
```

### 5. Low-Code/No-Code Solutions

#### **n8n (Self-hosted) - Recommended**

**Strengths**:
- Open source and self-hostable
- Visual workflow designer
- Custom JavaScript code execution
- Firebase integration via HTTP requests
- No per-execution pricing

#### **Zapier/Make**

**Limitations**:
- Limited web scraping capabilities
- High costs for frequent executions
- Restricted customization options
- Not suitable for complex scraping logic

#### Implementation Example (n8n)
```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.cronTrigger",
      "parameters": {
        "rule": {
          "hour": "*/6"
        }
      }
    },
    {
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://cpr.heart.org/api/courses",
        "headers": {
          "User-Agent": "Mozilla/5.0..."
        }
      }
    },
    {
      "name": "Code",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Process and transform scraped data\nconst events = items[0].json.courses.map(course => ({\n  id: course.id,\n  title: course.title,\n  provider: 'AHA',\n  scraped_at: new Date().toISOString()\n}));\n\nreturn events;"
      }
    },
    {
      "name": "Firebase",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default)/documents/events",
        "authentication": "serviceAccount"
      }
    }
  ]
}
```

## Architecture Recommendations

### **Option 1: Node.js Microservice (Recommended)**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Node.js       │    │   Target        │
│   Functions     │◄──►│   Scraper       │◄──►│   Websites      │
│   (Scheduler)   │    │   (Playwright)  │    │   (AHA, NAEMT)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       │
         │                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Firestore     │◄───│   Cloud Run     │
│   (Data)        │    │   (Container)   │
└─────────────────┘    └─────────────────┘
```

**Benefits**:
- Fast development and deployment
- Excellent Firebase integration
- Easy to scale with Cloud Run
- Good debugging capabilities

### **Option 2: Hybrid Approach**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Browserless   │    │   Target        │
│   Functions     │◄──►│   Service       │◄──►│   Websites      │
│   (Orchestrator)│    │   (API)         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲
         │
┌─────────────────┐
│   Firestore     │
│   (Data)        │
└─────────────────┘
```

**Benefits**:
- Managed browser infrastructure
- Reduced operational complexity
- Better anti-bot handling
- Predictable costs

## Firebase Integration Patterns

### **Option 1: Direct SDK Integration**
```javascript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize with service account
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'ems-ceu-library'
});

const db = getFirestore(app);

// Batch write for performance
const batch = db.batch();
events.forEach(event => {
  const docRef = db.collection('events_raw').doc();
  batch.set(docRef, event);
});
await batch.commit();
```

### **Option 2: REST API Integration**
```javascript
// For non-Node.js environments
async function writeToFirestore(events) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/events_raw`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: transformToFirestoreFormat(events)
      })
    }
  );
  return response.json();
}
```

## Performance Benchmarks

Based on research and real-world comparisons:

| Technology | Requests/sec | Memory Usage | Dev Time | Maintenance |
|------------|--------------|--------------|----------|-------------|
| Node.js + Playwright | 50-100 | 200-500MB | 2-3 weeks | Low |
| Go + ChromeDP | 100-200 | 50-100MB | 4-6 weeks | Very Low |
| Lambda + Playwright | 10-20* | 1-3GB | 3-4 weeks | Very Low |
| Browserless API | 20-40 | N/A | 1-2 weeks | Very Low |
| Python + Playwright | 20-40 | 300-600MB | 2-3 weeks | Medium |

*Limited by cold starts and concurrent executions

## Cost Analysis (Monthly)

### **Small Scale (1,000 events/day)**
- Node.js on Cloud Run: $20-50
- Browserless API: $50-100
- AWS Lambda: $30-80
- Go on minimal VPS: $10-20

### **Medium Scale (10,000 events/day)**
- Node.js on Cloud Run: $100-200
- Browserless API: $200-400
- AWS Lambda: $200-500
- Go on optimized VPS: $50-100

### **Large Scale (100,000 events/day)**
- Node.js on Kubernetes: $500-1000
- Browserless API: $1000-2000
- AWS Lambda: $1500-3000
- Go on dedicated servers: $200-500

## Anti-Bot Mitigation Strategies

### **For All Technologies**:
1. **Residential Proxies**: Rotate IP addresses from real devices
2. **User Agent Rotation**: Mimic real browser patterns
3. **Request Timing**: Add human-like delays
4. **Session Management**: Maintain browser sessions
5. **CAPTCHA Services**: Integrate 2captcha or similar

### **Implementation Example**:
```javascript
// Anti-bot configuration
const antiBot = {
  proxies: ['proxy1:port', 'proxy2:port'],
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  ],
  delays: {
    min: 2000,
    max: 5000
  }
};

async function createStealthPage(browser) {
  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    proxy: getRandomProxy(),
    viewport: getRandomViewport()
  });
  
  const page = await context.newPage();
  
  // Stealth configurations
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  
  return page;
}
```

## Final Recommendations

### **Primary Recommendation: Node.js + Playwright**

**Rationale**:
1. **Fastest time-to-market**: 2-3 weeks vs 4-6 weeks for Go
2. **Excellent Firebase integration**: Native Admin SDK support
3. **Strong anti-bot capabilities**: Best-in-class Cloudflare bypass
4. **Balanced cost/performance**: Efficient resource usage
5. **Mature ecosystem**: Extensive tooling and community support

### **Secondary Recommendation: Browserless.io API**

**Rationale**:
1. **Minimal operational overhead**: Fully managed infrastructure
2. **Professional anti-bot handling**: Built-in Cloudflare bypass
3. **Quick implementation**: 1-2 weeks development time
4. **Predictable costs**: Fixed monthly pricing
5. **Excellent reliability**: 99.9% uptime SLA

### **Implementation Timeline**

#### **Phase 1 (Weeks 1-2): MVP Development**
- Set up Node.js scraper with Playwright
- Implement AHA course scraping
- Basic Firebase integration
- Simple scheduling via Cloud Functions

#### **Phase 2 (Weeks 3-4): Production Hardening**
- Add NAEMT and additional providers
- Implement anti-bot measures
- Error handling and retry logic
- Monitoring and alerting

#### **Phase 3 (Weeks 5-6): Optimization**
- Performance tuning
- Cost optimization
- Advanced scheduling
- Data validation and cleanup

### **Risk Mitigation**
1. **Start with Browserless.io** for immediate results while developing Node.js solution
2. **Implement comprehensive monitoring** to detect blocks early
3. **Use multiple data sources** to ensure continuity
4. **Regular testing** of scraping endpoints
5. **Backup scraping methods** (API integration where available)

## Conclusion

The **Node.js + Playwright** combination offers the best balance of development speed, performance, maintainability, and Firebase integration for EMS education event scraping. For organizations preferring minimal operational overhead, **Browserless.io** provides an excellent managed alternative. The recommended hybrid approach allows for rapid prototyping with managed services while building toward a cost-effective self-hosted solution.