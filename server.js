require('dotenv').config();
const express = require('express');
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '12mb' }));

// Configure CORS: restrict origins in production by setting FRONTEND_ORIGIN in .env
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5500').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow non-browser requests (curl)
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  }
}));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use('/api/', limiter);

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn('WARNING: GOOGLE_API_KEY not set in environment');
}

async function forwardToGoogle(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

app.post('/api/generate', async (req, res) => {
  try {
    if (!GOOGLE_API_KEY) return res.status(500).json({ error: 'Server missing API key' });

    // Basic validation: ensure inlineData is present and not too large
    const sizeLimit = 10 * 1024 * 1024; // 10MB of base64
    try {
      const bodyString = JSON.stringify(req.body);
      if (bodyString.length > sizeLimit * 1.37) { // base64 expands
        return res.status(413).json({ error: 'Payload too large' });
      }
    } catch (e) { /* ignore */ }

    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GOOGLE_API_KEY}`;

    const gRes = await forwardToGoogle(googleUrl, req.body);
    const text = await gRes.text();
    try {
      const json = JSON.parse(text);
      return res.status(gRes.status).json(json);
    } catch (err) {
      return res.status(gRes.status).json({ rawText: text, status: gRes.status });
    }
  } catch (err) {
    console.error('generate error', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

app.post('/api/imagen', async (req, res) => {
  try {
    if (!GOOGLE_API_KEY) return res.status(500).json({ error: 'Server missing API key' });

    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GOOGLE_API_KEY}`;
    const gRes = await forwardToGoogle(googleUrl, req.body);
    const text = await gRes.text();
    try {
      const json = JSON.parse(text);
      return res.status(gRes.status).json(json);
    } catch (err) {
      return res.status(gRes.status).json({ rawText: text, status: gRes.status });
    }
  } catch (err) {
    console.error('imagen error', err);
    res.status(500).json({ error: 'Proxy image error', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server listening on ${PORT}`);
});
