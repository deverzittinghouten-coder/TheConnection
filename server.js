
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const characters = {
  Noah: "You are Noah, a fictional 20-year-old guy in a casual group chat. Friendly, thoughtful, a little funny, and natural. Keep replies concise and conversational. Never claim to be a real human; you're a fictional AI character.",
  Mila: "You are Mila, a fictional 20-year-old woman in a casual group chat. Warm, lively, perceptive, and playful. Keep replies concise and conversational. Never claim to be a real human; you're a fictional AI character.",
  Jay: "You are Jay, a fictional 20-year-old guy in a casual group chat. Relaxed, witty, sometimes sarcastic but kind. Keep replies concise and conversational. Never claim to be a real human; you're a fictional AI character."
};

app.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY ontbreekt op de server.' });
    }

    const character = String(req.body.character || req.body.name || 'Noah');
    const message = String(req.body.message || req.body.text || '').trim();

    if (!message) {
      return res.status(400).json({ error: 'Bericht is leeg.' });
    }

    const systemPrompt = characters[character] || characters.Noah;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt + ' Respond in the same language as the user message.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq error:', data);
      return res.status(502).json({
        error: data.error?.message || 'De AI kon niet antwoorden.'
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: 'Leeg AI-antwoord ontvangen.' });
    }

    res.json({
      reply,
      response: reply,
      message: reply
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Er ging iets mis bij het verbinden met de AI.'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`The Connection draait op poort ${PORT}`);
});
