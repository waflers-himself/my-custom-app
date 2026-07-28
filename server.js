const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3');
const http = require('http');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- DATABASE ---
const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'In Progress',
    priority TEXT DEFAULT 'Medium'
  )`);
  db.run("SELECT count(*) as count FROM conversations", (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(`INSERT INTO conversations (title, summary) VALUES ('Welcome', 'System ready')`);
      db.run(`INSERT INTO tasks (name, status, priority) VALUES ('Check battery voltage', 'In Progress', 'High')`);
      db.run(`INSERT INTO tasks (name, status, priority) VALUES ('Flash firmware', 'Pending', 'Medium')`);
    }
  });
});

// --- AI CHAT (OpenRouter) ---
const SYSTEM_PROMPT = `You are an expert e-bike diagnostic technician. Answer clearly and concisely. Use numbered steps when giving procedures. Be direct and technical.`;

async function callAI(prompt, history) {
  if (!process.env.OPENROUTER_API_KEY) {
    return 'Error: No API key configured in .env (OPENROUTER_API_KEY)';
  }
  try {
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (history && history.length > 0) {
      history.forEach(m => messages.push({ role: m.role, content: m.content }));
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'Jarvis'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-20250514',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || 'No response received.';
  } catch (e) {
    return 'AI Error: ' + e.message;
  }
}

// --- API ROUTES ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', keys: { openrouter: !!process.env.OPENROUTER_API_KEY } }));

app.get('/api/conversations', (req, res) => {
  db.all('SELECT * FROM conversations ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  // Save user message to DB
  db.run('INSERT INTO conversations (title, summary) VALUES (?, ?)', [message, message], () => {});

  // Get last 10 messages from DB as history (keeps token cost low)
  db.all('SELECT message_id, role, content FROM (SELECT * FROM messages ORDER BY id DESC LIMIT 10) ORDER BY id ASC', [], (err, history) => {});

  const reply = await callAI(message, history);

  // Save reply to DB
  db.run('INSERT INTO conversations (title, summary) VALUES (?, ?)', ['Jarvis', reply], () => {});

  res.json({ reply: reply });
});

// Tasks API
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY priority DESC, id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/tasks', (req, res) => {
  const { name, status, priority } = req.body;
  db.run('INSERT INTO tasks (name, status, priority) VALUES (?, ?, ?)', [name, status || 'Pending', priority || 'Medium'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, status: status || 'Pending', priority: priority || 'Medium' });
  });
});

app.patch('/api/tasks/:id', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Weather
app.get('/api/weather', async (req, res) => {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=53.74&longitude=-1.79&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe%2FLondon';
    const r = await fetch(url);
    const d = await r.json();
    res.json(d);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// MCP Search
app.get('/api/mcp-search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ results: [], message: 'codebase-memory-mcp not installed or no query' });

  try {
    const cmd = `codebase-memory-mcp cli search_graph '{"query": "' + query + '", "project": "."}'`;
    const { execSync } = require('child_process');
    const out = execSync(cmd, { timeout: 10000, encoding: 'utf8' });
    res.json({ results: JSON.parse(out) });
  } catch (e) {
    res.json({ results: [], message: 'MCP not available: ' + e.message + '. Run: curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh | bash' });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log('Server running on http://0.0.0.0:' + PORT));
