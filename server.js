const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_FOOTBALL_KEY || '507600b79790d08f00128460268cc8f6';
const API_BASE = 'https://v3.football.api-sports.io';

app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint — browser calls /api/live, server calls API-Football
app.get('/api/live', async (req, res) => {
  try {
    const r = await fetch(`${API_BASE}/fixtures?league=1&season=2026&live=all`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy for a specific fixture (for score + minute polling)
app.get('/api/fixture/:id', async (req, res) => {
  try {
    const r = await fetch(`${API_BASE}/fixtures?id=${req.params.id}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`World Cup 2026 app running on port ${PORT}`);
});
