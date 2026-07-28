const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- DATABASE SETUP (Preserved from your previous setup) ---
const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);
db.run(`CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, status TEXT DEFAULT 'In Progress', priority TEXT DEFAULT 'Medium'
)`);
db.run(`CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, summary TEXT NOT NULL
)`);

// Seed data if empty
db.get("SELECT count(*) as count FROM items", (err, row) => {
  if (!err && row.count === 0) {
    db.run(`INSERT INTO items (name, status, priority) VALUES ('Check battery voltage', 'In Progress', 'High')`);
    db.run(`INSERT INTO items (name, status, priority) VALUES ('Flash controller firmware', 'Ready', 'Low')`);
    db.run(`INSERT INTO conversations (title, summary) VALUES ('Motor stuttering', 'User reports stutter under load. Need wiring check guide.')`);
  }
});

// --- AI PROVIDER ROUTER ---
const SYSTEM_PROMPT = `You are an expert e-bike electrical engineer and diagnostician. ALWAYS follow this structure:
1. OBSERVATIONS: List visible symptoms or error codes from the prompt/images.
2. PRELIMINARY CHECKS: Suggest safe multimeter/visual tests first.
3. STEP-BY-STEP ISOLATION: Process-of-elimination troubleshooting.
4. PROBABLE CAUSES: Rank from cheapest/easiest fix to most expensive.
NEVER declare a controller or motor dead without suggesting at least 2 verification tests first. Use clear, technical but accessible language.`;

async function routeAIRequest(provider, mode, prompt, imageUrl) {
  try {
    if (provider === 'groq') {
      return await callGroq(mode, prompt);
    }
    if (provider === 'gemini') {
      return await callGemini(prompt, imageUrl);
    }
    if (provider === 'openrouter') {
      return await callOpenRouter(mode, prompt, imageUrl);
    }
    throw new Error('Invalid provider selected');
  } catch (err) {
    console.error(`[${provider}] AI Error:`, err.message);
    return `⚠️ AI Service Error: ${err.message}. Please check your ${provider.toUpperCase()} API key or try another model.`;
  }
}

async function callGroq(model, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Groq returned empty response.';
}

async function callGemini(prompt, imageUrl) {
  const parts = [{ text: `${SYSTEM_PROMPT}\n\nUser Query: ${prompt}` }];
  if (imageUrl) {
    const base64Data = imageUrl.split(',')[1];
    const mimeType = imageUrl.split(';')[0].split(':')[1];
    parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] })
  });
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini returned empty response.';
}

async function callOpenRouter(model, prompt, imageUrl) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: imageUrl ? `[Image Analysis Request]\n${prompt}` : prompt }];
  // Note: OpenRouter currently requires image uploads via special formatting. Keeping it text-safe for stability.
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'Jarvis Diagnostics'
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 })
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'OpenRouter returned empty response.';
}

// --- API ENDPOINTS ---
app.post('/api/diagnose', async (req, res) => {
  try {
    const { prompt, imageUrl, provider, mode } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    
    const aiResponse = await routeAIRequest(provider || 'groq', mode || 'llama-3.3-70b-versatile', prompt, imageUrl);
    res.json({ result: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY id DESC', [], (err, rows) => res.json(rows || []));
});

app.get('/api/conversations', (req, res) => {
  db.all('SELECT * FROM conversations ORDER BY id DESC', [], (err, rows) => res.json(rows || []));
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on http://0.0.0.0:${PORT}`));
