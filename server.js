const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_FOOTBALL_KEY || '507600b79790d08f00128460268cc8f6';
const API_BASE = 'https://v3.football.api-sports.io';

app.use(express.static(path.join(__dirname, 'public')));

// Live scores proxy - tries live=all filtered to league 1, falls back to today's fixtures
app.get('/api/live', async (req, res) => {
  try {
    // First try live matches for World Cup league 1
    const r = await fetch(`${API_BASE}/fixtures?live=all&league=1&season=2026`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await r.json();
    console.log('Live API response - errors:', JSON.stringify(data.errors), 'count:', data.results);

    // If no live matches, fetch today's fixtures so we can show scores for finished games
    if (!data.errors || Object.keys(data.errors).length === 0) {
      if (data.results === 0) {
        // Try today's date
        const today = new Date().toISOString().split('T')[0];
        const r2 = await fetch(`${API_BASE}/fixtures?league=1&season=2026&date=${today}`, {
          headers: { 'x-apisports-key': API_KEY }
        });
        const data2 = await r2.json();
        console.log('Today fixtures count:', data2.results);
        return res.json(data2);
      }
    }
    res.json(data);
  } catch (e) {
    console.error('Live API error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Debug endpoint - shows raw API response
app.get('/api/debug', async (req, res) => {
  try {
    const r = await fetch(`${API_BASE}/fixtures?live=all`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await r.json();
    res.json({ 
      status: r.status, 
      errors: data.errors, 
      results: data.results,
      first: data.response ? data.response[0] : null
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`World Cup 2026 app running on port ${PORT}`);
});
