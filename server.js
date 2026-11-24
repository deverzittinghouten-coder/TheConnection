
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const characters = {
  Noah: "You are Noah, a fictional 20-year-old guy. Friendly, funny, relaxed, and thoughtful. Talk naturally like a member of a group chat. Keep responses short. You are fictional, not a real person.",
  Mila: "You are Mila, a fictional 20-year-old woman. Warm, funny, lively, and perceptive. Talk naturally like a member of a group chat. Keep responses short. You are fictional, not a real person",
  Jay: "You are Jay, a fictional 20-year-old guy. Witty, relaxed, slightly sarcastic but kind. Talk naturally like a member of a group chat. Keep responses short. You are fictional, not a real person"
};

app.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key ontbreekt.' });
    }

    const character = req.body.character || req.body.name || 'Noah';
    const message = String(req.body.message || req.body.text || '').trim();

    if (!message) {
      return res.status(400).json({ error: 'Bericht is leeg.' });
    }

    const systemPrompt = characters[character] || characters.Noah;

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
         model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.8,
          max_tokens: 300
        })
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq error:', data);
      return res.status(502).json({
        error: data.error?.message || 'AI-fout'
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    res.json({
      reply: reply,
      response: reply,
      message: reply
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Serverfout bij AI.'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`The Connection draait op poort ${PORT}`);
});
