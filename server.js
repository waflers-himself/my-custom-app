import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const storageFile = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json({ limit: '10mb' })); // <-- Update this line in server.js[cite: 1]

let db;
let sqliteAvailable = false;
const fallbackStore = {
  items: [],
  conversations: []
};

async function loadFallbackStore() {
  try {
    const raw = await fs.readFile(storageFile, 'utf8');
    const parsed = JSON.parse(raw);
    fallbackStore.items = parsed.items || [];
    fallbackStore.conversations = parsed.conversations || [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    fallbackStore.items = [];
    fallbackStore.conversations = [];
  }
}

async function saveFallbackStore() {
  await fs.writeFile(storageFile, JSON.stringify(fallbackStore, null, 2));
}

async function seedFallbackData() {
  if (fallbackStore.conversations.length === 0) {
    fallbackStore.conversations.push(
      {
        id: 1,
        title: 'Morning Prep',
        summary: 'Summarize commute and weather.',
        assistantMessage: 'Weather briefing: Cool and windy in New York. A dynamic route with light traffic on main roads. Consider a jacket.'
      },
      {
        id: 2,
        title: 'Training Plan',
        summary: 'Create a recovery-focused routine.',
        assistantMessage: 'Your training plan is set with better recovery windows and adaptive pacing.'
      },
      {
        id: 3,
        title: 'Trip notes',
        summary: 'Log final data for June.',
        assistantMessage: 'Trip notes are ready for final review; ensure inventory and schedule updates are synced.'
      }
    );
  }

  if (fallbackStore.items.length === 0) {
    fallbackStore.items.push(
      { id: 1, name: 'Bike repair', owner: 'Mina', priority: 'High', status: 'In Progress', created_at: new Date().toISOString() },
      { id: 2, name: 'Route planning', owner: 'Leo', priority: 'Medium', status: 'Queued', created_at: new Date().toISOString() },
      { id: 3, name: 'Weather briefing', owner: 'Ava', priority: 'Low', status: 'Ready', created_at: new Date().toISOString() }
    );
  }

  await saveFallbackStore();
}

async function initializeDatabase() {
  try {
    const sqlite3Module = await import('sqlite3');
    const sqlite3 = sqlite3Module.default || sqlite3Module;

    db = await open({
      filename: path.join(__dirname, 'data.db'),
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'In Progress',
        owner TEXT NOT NULL DEFAULT 'System',
        priority TEXT NOT NULL DEFAULT 'Medium',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        assistantMessage TEXT NOT NULL DEFAULT ''
      );
    `);

    const existingConv = await db.get('SELECT id FROM conversations LIMIT 1');
    if (!existingConv) {
      await db.run('INSERT INTO conversations (title, summary, assistantMessage) VALUES (?, ?, ?)', ['Morning Prep', 'Summarize commute and weather.', 'Weather briefing: Cool and windy in New York. Light traffic on main roads.']);
      await db.run('INSERT INTO conversations (title, summary, assistantMessage) VALUES (?, ?, ?)', ['Training Plan', 'Create a recovery-focused routine.', 'Your training plan is set with better recovery windows and adaptive pacing.']);
      await db.run('INSERT INTO conversations (title, summary, assistantMessage) VALUES (?, ?, ?)', ['Trip notes', 'Log final data for June.', 'Trip notes are ready for final review; ensure inventory and schedule updates are synced.']);
    }

    const existingItems = await db.get('SELECT id FROM items LIMIT 1');
    if (!existingItems) {
      await db.run('INSERT INTO items (name, owner, priority, status) VALUES (?, ?, ?, ?)', ['Bike repair', 'Mina', 'High', 'In Progress']);
      await db.run('INSERT INTO items (name, owner, priority, status) VALUES (?, ?, ?, ?)', ['Route planning', 'Leo', 'Medium', 'Queued']);
      await db.run('INSERT INTO items (name, owner, priority, status) VALUES (?, ?, ?, ?)', ['Weather briefing', 'Ava', 'Low', 'Ready']);
    }

    sqliteAvailable = true;
  } catch (error) {
    console.warn('SQLite unavailable, falling back to JSON storage:', error?.message || error);
    await loadFallbackStore();
    await seedFallbackData();
  }
}

const getItems = async () => {
  if (sqliteAvailable) return db.all('SELECT * FROM items ORDER BY created_at DESC');
  return [...fallbackStore.items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const getConversations = async () => {
  if (sqliteAvailable) return db.all('SELECT id, title, summary, assistantMessage FROM conversations ORDER BY id DESC');
  return [...fallbackStore.conversations].sort((a, b) => b.id - a.id);
};

const createItem = async ({ name, status = 'In Progress', owner = 'System', priority = 'Medium' }) => {
  if (sqliteAvailable) {
    const result = await db.run(
      'INSERT INTO items (name, status, owner, priority) VALUES (?, ?, ?, ?)',
      [name, status, owner, priority]
    );
    return db.get('SELECT * FROM items WHERE id = ?', [result.lastID]);
  }

  const id = fallbackStore.items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
  const created = { id, name, status, owner, priority, created_at: new Date().toISOString() };
  fallbackStore.items.unshift(created);
  await saveFallbackStore();
  return created;
};

const deleteItemById = async (id) => {
  if (sqliteAvailable) return db.run('DELETE FROM items WHERE id = ?', [id]);

  const index = fallbackStore.items.findIndex((item) => item.id === Number(id));
  if (index === -1) return { changes: 0 };

  fallbackStore.items.splice(index, 1);
  await saveFallbackStore();
  return { changes: 1 };
};

const SYSTEM_PROMPT = `
You are an expert e-bike technician and electrical engineer.
When analyzing an issue or image:
1. OBSERVATIONS: Identify key symptoms, error codes, or visual defects.
2. PRELIMINARY CHECKS: Suggest safe, non-destructive tests (e.g. multimeter checks on battery/controller, connector inspection).
3. STEP-BY-STEP ISOLATION: Process-of-elimination troubleshooting guide.
4. PROBABLE CAUSES: Rank potential issues from cheapest/easiest fix to most expensive fix.
NEVER jump straight to declaring a major component dead without suggesting verification steps first.
`;

// Helper: Call Gemini
async function callGemini(prompt, imageUrl) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Gemini: API key missing in .env";

  try {
    const parts = [{ text: `${SYSTEM_PROMPT}\n\nUser Question: ${prompt}` }];
    if (imageUrl) {
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.split(';')[0].split(':')[1];
      parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini could not process request.";
  } catch (err) {
    return `Gemini Error: ${err.message}`;
  }
}

// Helper: Call Groq (Llama 3)
async function callGroq(prompt, imageUrl) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "Groq: API key missing in .env";

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Groq could not process request.";
  } catch (err) {
    return `Groq Error: ${err.message}`;
  }
}

// Helper: Call Azure OpenAI (GPT-4o mini)
async function callAzureOpenAI(promptText, imageUrl) {
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (!apiKey || !endpoint) return "Azure OpenAI: Credentials missing in .env";

  try {
    const userContent = [{ type: "text", text: promptText }];
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent }
        ]
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Azure OpenAI could not process request.";
  } catch (err) {
    return `Azure Error: ${err.message}`;
  }
}

// POST /api/diagnose Endpoint
app.post('/api/diagnose', async (req, res) => {
  try {
    const { prompt, imageUrl, modelMode } = req.body;
    if (!prompt && !imageUrl) {
      return res.status(400).json({ error: "Please provide a symptom description or an image." });
    }

    if (modelMode === 'gemini-flash') {
      const responseText = await callGemini(prompt, imageUrl);
      return res.json({ result: responseText });
    }

    if (modelMode === 'groq-llama3') {
      const responseText = await callGroq(prompt, imageUrl);
      return res.json({ result: responseText });
    }

    if (modelMode === 'azure-gpt4o') {
      const responseText = await callAzureOpenAI(prompt, imageUrl);
      return res.json({ result: responseText });
    }

    // Consensus Mode: Run all 3 parallelly + synthesize
    const [reportGemini, reportGroq, reportAzure] = await Promise.all([
      callGemini(prompt, imageUrl),
      callGroq(prompt, imageUrl),
      callAzureOpenAI(prompt, imageUrl)
    ]);

    const synthesisPrompt = `
You are the Lead Master E-Bike Technician. Compare the reports below from 3 junior technicians and synthesize them into ONE definitive, highly organized step-by-step master diagnostic guide. Eliminate contradictions and pick the safest troubleshooting steps:

Report 1 (Gemini): ${reportGemini}
Report 2 (Groq): ${reportGroq}
Report 3 (Azure): ${reportAzure}
`;

    const finalMasterReport = await callAzureOpenAI(synthesisPrompt, null);

    return res.json({
      result: finalMasterReport,
      rawReports: { reportGemini, reportGroq, reportAzure }
    });

  } catch (error) {
    console.error("Diagnostic error:", error);
    res.status(500).json({ error: "Failed to execute diagnostic check." });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const items = await getItems();
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await getConversations();
    res.json(conversations);
  } catch {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { name, status = 'In Progress', owner = 'System', priority = 'Medium' } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Item name is required' });

    const created = await createItem({ name, status, owner, priority });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteItemById(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, id });
  } catch {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on http://0.0.0.0:${PORT}`));
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
