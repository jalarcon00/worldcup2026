const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_FOOTBALL_KEY || '507600b79790d08f00128460268cc8f6';
const API_BASE = 'https://v3.football.api-sports.io';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Live scores proxy
app.get('/api/live', async (req, res) => {
  try {
    const r = await fetch(`${API_BASE}/fixtures?live=all`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await r.json();
    console.log('Live results:', data.results);
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (e) {
    console.error('Live API error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Today's fixtures
app.get('/api/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`${API_BASE}/fixtures?league=1&season=2026&date=${today}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await r.json();
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Claude AI prediction proxy
app.post('/api/predict', async (req, res) => {
  try {
    const { team1, team2, group, ground } = req.body;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a 2026 World Cup analyst. Predict: ${team1} vs ${team2} (${group}, ${ground}). Respond ONLY valid JSON no markdown: {"homeWin":<0-100>,"draw":<0-100>,"awayWin":<0-100>,"score":"e.g. 2-1","analysis":"2-3 sentences","confidence":"High" or "Medium" or "Low"}`
        }]
      })
    });
    const data = await r.json();
    const text = (data.content && data.content.find(c => c.type === 'text') || {}).text || '{}';
    const prediction = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json(prediction);
  } catch (e) {
    console.error('Predict error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
  try {
    const r = await fetch(`${API_BASE}/fixtures?live=all`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await r.json();
    res.json({ status: r.status, errors: data.errors, results: data.results, first: data.response ? data.response[0] : null });
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
