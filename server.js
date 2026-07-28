import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// ---------- DATABASE ----------
const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'In Progress',
    priority TEXT DEFAULT 'Medium'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL
  )`);

  db.get("SELECT count(*) as count FROM items", (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(`INSERT INTO items (name, status, priority) VALUES ('Check battery voltage', 'In Progress', 'High')`);
      db.run(`INSERT INTO items (name, status, priority) VALUES ('Flash controller firmware', 'Ready', 'Low')`);
      db.run(`INSERT INTO conversations (title, summary) VALUES ('Motor stuttering', 'User reports stutter under load.')`);
    }
  });
});

// ---------- AI ROUTER ----------
const SYSTEM_PROMPT = `You are an expert e-bike electrical engineer and diagnostician. ALWAYS follow this structure:
1. OBSERVATIONS: List visible symptoms or error codes from the prompt/images.
2. PRELIMINARY CHECKS: Suggest safe multimeter/visual tests first.
3. STEP-BY-STEP ISOLATION: Process-of-elimination troubleshooting.
4. PROBABLE CAUSES: Rank from cheapest/easiest fix to most expensive.
NEVER declare a controller or motor dead without suggesting at least 2 verification tests first.`;

async function callGroq(model, prompt) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY missing in .env');
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || 'Groq returned empty response.';
}

async function callGemini(model, prompt, imageUrl) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing in .env');
  const parts = [{ text: `${SYSTEM_PROMPT}\n\nUser Query: ${prompt}` }];
  if (imageUrl && imageUrl.includes(',')) {
    parts.push({
      inline_data: {
        mime_type: imageUrl.split(';')[0].split(':')[1],
        data: imageUrl.split(',')[1]
      }
    });
  }
  const m = model || 'gemini-2.0-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] })
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini returned empty response.';
}

async function callOpenRouter(model, prompt, imageUrl) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY missing in .env');
  let userContent = prompt;
  if (imageUrl) {
    userContent = [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imageUrl } }
    ];
  }
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'Jarvis Diagnostics'
    },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || 'OpenRouter returned empty response.';
}

async function routeAIRequest(provider, model, prompt, imageUrl) {
  try {
    if (provider === 'groq') return await callGroq(model, prompt);
    if (provider === 'gemini') return await callGemini(model, prompt, imageUrl);
    if (provider === 'openrouter') return await callOpenRouter(model, prompt, imageUrl);
    throw new Error('Unknown provider: ' + provider);
  } catch (err) {
    console.error(`[${provider}] AI Error:`, err.message);
    return `AI Service Error (${provider}): ${err.message}`;
  }
}

// ---------- API ROUTES ----------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    keys: {
      groq: !!process.env.GROQ_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY
    }
  });
});

app.post('/api/diagnose', async (req, res) => {
  const { prompt, imageUrl, provider, mode, model } = req.body;
  if (!prompt && !imageUrl) return res.status(400).json({ error: 'Prompt required' });
  const result = await routeAIRequest(provider || 'groq', model || mode, prompt, imageUrl);
  res.json({ result });
});

app.post('/api/chat', async (req, res) => {
  const { message, prompt, provider, model } = req.body;
  const text = message || prompt;
  if (!text) return res.status(400).json({ error: 'Message required' });
  const reply = await routeAIRequest(provider || 'groq', model, text, null);
  res.json({ reply, response: reply });
});

app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY id DESC', [], (err, rows) => res.json(rows || []));
});

app.post('/api/items', (req, res) => {
  const { name, status, priority } = req.body;
  db.run('INSERT INTO items (name, status, priority) VALUES (?, ?, ?)',
    [name, status || 'In Progress', priority || 'Medium'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, status: status || 'In Progress', priority: priority || 'Medium' });
    });
});

app.delete('/api/items/:id', (req, res) => {
  db.run('DELETE FROM items WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/conversations', (req, res) => {
  db.all('SELECT * FROM conversations ORDER BY id DESC', [], (err, rows) => res.json(rows || []));
});

// ---------- STATIC FRONTEND (must be LAST) ----------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
