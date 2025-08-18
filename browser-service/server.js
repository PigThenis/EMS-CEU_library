import express from 'express';
import { chromium } from 'playwright';
import { nanoid } from 'nanoid';

// Simple Playwright-based browser service with session management.
// Not a full MCP implementation; provides an HTTP API that can be wrapped by the Python orchestrator.
// Endpoints:
// - POST /session -> { sessionId }
// - POST /close { sessionId }
// - POST /navigate { sessionId, url }
// - POST /waitFor { sessionId, selector, timeoutMs? }
// - GET  /content?sessionId&format=html|text
// - POST /evaluate { sessionId, functionBody, args? }
// - POST /screenshot { sessionId, fullPage?, selector? } -> { base64 }

const app = express();
app.use(express.json({ limit: '1mb' }));

const state = {
  browser: null,
  sessions: new Map(), // sessionId -> { context, page }
};

async function ensureBrowser() {
  if (!state.browser) {
    state.browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  }
  return state.browser;
}

app.post('/session', async (_req, res) => {
  try {
    const browser = await ensureBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = nanoid();
    state.sessions.set(sessionId, { context, page });
    res.json({ sessionId });
  } catch (err) {
    console.error('session error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/close', async (req, res) => {
  const { sessionId } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    await s.page.close({ runBeforeUnload: false }).catch(() => {});
    await s.context.close().catch(() => {});
    state.sessions.delete(sessionId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/navigate', async (req, res) => {
  const { sessionId, url, waitUntil = 'domcontentloaded', timeoutMs = 30000 } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    const resp = await s.page.goto(url, { waitUntil, timeout: timeoutMs });
    res.json({ ok: true, status: resp?.status() ?? null });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/waitFor', async (req, res) => {
  const { sessionId, selector, timeoutMs = 15000, state: waitState = 'attached' } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    await s.page.waitForSelector(selector, { timeout: timeoutMs, state: waitState });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/content', async (req, res) => {
  const sessionId = req.query.sessionId;
  const format = req.query.format || 'html';
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    if (format === 'text') {
      const text = await s.page.textContent('body');
      res.type('text/plain').send(text ?? '');
    } else {
      const html = await s.page.content();
      res.type('text/html').send(html);
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/evaluate', async (req, res) => {
  const { sessionId, functionBody, args = [] } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    // Wrap functionBody into a function and invoke with args in the page context.
    const result = await s.page.evaluate(new Function('...args', functionBody), ...args);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/screenshot', async (req, res) => {
  const { sessionId, fullPage = false, selector = null, type = 'png' } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    let buffer;
    if (selector) {
      const el = await s.page.$(selector);
      if (!el) return res.status(404).json({ error: 'selector not found' });
      buffer = await el.screenshot({ type });
    } else {
      buffer = await s.page.screenshot({ fullPage, type });
    }
    res.json({ ok: true, base64: buffer.toString('base64'), mime: type === 'png' ? 'image/png' : 'image/jpeg' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Health & graceful shutdown
app.get('/healthz', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8787;
app.listen(port, async () => {
  await ensureBrowser();
  console.log(`browser-service listening on :${port}`);
});

process.on('SIGTERM', async () => {
  for (const [sessionId, s] of state.sessions) {
    await s.page.close().catch(() => {});
    await s.context.close().catch(() => {});
    state.sessions.delete(sessionId);
  }
  await state.browser?.close().catch(() => {});
  process.exit(0);
});

import express from 'express';
import { chromium } from 'playwright';
import { nanoid } from 'nanoid';

// Simple Playwright-based browser service with session management.
// Not a full MCP implementation; provides an HTTP API that can be wrapped by the Python orchestrator.
// Endpoints:
// - POST /session -> { sessionId }
// - POST /close { sessionId }
// - POST /navigate { sessionId, url }
// - POST /waitFor { sessionId, selector, timeoutMs? }
// - GET  /content?sessionId&format=html|text
// - POST /evaluate { sessionId, functionBody, args? }
// - POST /screenshot { sessionId, fullPage?, selector? } -> { base64 }

const app = express();
app.use(express.json({ limit: '1mb' }));

const state = {
  browser: null,
  sessions: new Map(), // sessionId -> { context, page }
};

async function ensureBrowser() {
  if (!state.browser) {
    state.browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  }
  return state.browser;
}

app.post('/session', async (_req, res) => {
  try {
    const browser = await ensureBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = nanoid();
    state.sessions.set(sessionId, { context, page });
    res.json({ sessionId });
  } catch (err) {
    console.error('session error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/close', async (req, res) => {
  const { sessionId } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    await s.page.close({ runBeforeUnload: false }).catch(() => {});
    await s.context.close().catch(() => {});
    state.sessions.delete(sessionId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/navigate', async (req, res) => {
  const { sessionId, url, waitUntil = 'domcontentloaded', timeoutMs = 30000 } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    const resp = await s.page.goto(url, { waitUntil, timeout: timeoutMs });
    res.json({ ok: true, status: resp?.status() ?? null });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/waitFor', async (req, res) => {
  const { sessionId, selector, timeoutMs = 15000, state: waitState = 'attached' } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    await s.page.waitForSelector(selector, { timeout: timeoutMs, state: waitState });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/content', async (req, res) => {
  const sessionId = req.query.sessionId;
  const format = req.query.format || 'html';
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    if (format === 'text') {
      const text = await s.page.textContent('body');
      res.type('text/plain').send(text ?? '');
    } else {
      const html = await s.page.content();
      res.type('text/html').send(html);
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/evaluate', async (req, res) => {
  const { sessionId, functionBody, args = [] } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    // Wrap functionBody into a function and invoke with args in the page context.
    const result = await s.page.evaluate(new Function('...args', functionBody), ...args);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/screenshot', async (req, res) => {
  const { sessionId, fullPage = false, selector = null, type = 'png' } = req.body || {};
  const s = state.sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'invalid session' });
  try {
    let buffer;
    if (selector) {
      const el = await s.page.$(selector);
      if (!el) return res.status(404).json({ error: 'selector not found' });
      buffer = await el.screenshot({ type });
    } else {
      buffer = await s.page.screenshot({ fullPage, type });
    }
    res.json({ ok: true, base64: buffer.toString('base64'), mime: type === 'png' ? 'image/png' : 'image/jpeg' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Health & graceful shutdown
app.get('/healthz', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8787;
app.listen(port, async () => {
  await ensureBrowser();
  console.log(`browser-service listening on :${port}`);
});

process.on('SIGTERM', async () => {
  for (const [sessionId, s] of state.sessions) {
    await s.page.close().catch(() => {});
    await s.context.close().catch(() => {});
    state.sessions.delete(sessionId);
  }
  await state.browser?.close().catch(() => {});
  process.exit(0);
});
