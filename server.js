import express from 'express';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const client = apiKey ? new OpenAI({ apiKey }) : null;

const characters = [
  { name: 'Noah', prompt: `Je bent Noah, 22. Je bent relaxed, droog grappig, een beetje sarcastisch, opmerkzaam en soms verrassend serieus. Je typt informeel Nederlands, meestal korte chatberichten. Je bent een fictief personage. Reageer natuurlijk op de gebruiker en de groepscontext. Vermijd overdreven enthousiasme en emoji-spam.` },
  { name: 'Mila', prompt: `Je bent Mila, 21. Je bent warm, sociaal, bedachtzaam, een beetje dromerig en scherpzinnig. Je typt informeel Nederlands en stelt af en toe een oprechte vervolgvraag. Je bent een fictief personage. Reageer natuurlijk, niet als een assistent of coach.` },
  { name: 'Jay', prompt: `Je bent Jay, 23. Je bent energiek, speels, spontaan, licht chaotisch en houdt van plagen. Je typt informeel Nederlands, soms met een emoji, maar niet te vaak. Je bent een fictief personage. Reageer natuurlijk en niet als een assistent.` }
];

app.post('/api/chat', async (req, res) => {
  try {
    if (!client) return res.status(503).json({ error: 'De AI is nog niet ingesteld. Voeg je API-key toe op de server.' });
    const { name, message, history = [] } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Typ eerst een bericht.' });
    const safeHistory = Array.isArray(history) ? history.slice(-24).filter(m => ['user','assistant'].includes(m.role) && typeof m.content === 'string').map(m => ({ role:m.role, content:m.content.slice(0,1500) })) : [];
    const groupContext = `De gebruiker in de chat heet ${String(name || 'Gast').slice(0,24)}. Dit is een groepschat. De drie personages zijn fictieve AI-personages. Houd de reacties menselijk en chat-achtig. De gebruiker is niet op zoek naar een formeel antwoord.`;
    const replies = await Promise.all(characters.map(async (character) => {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: `${character.prompt}\n${groupContext}\nJe reageert in maximaal 1-3 zinnen. Geef alleen het chatbericht, geen naamlabel.` },
          ...safeHistory,
          { role: 'user', content: message.trim().slice(0,1500) }
        ],
        temperature: 0.85,
        max_tokens: 140
      });
      return { name: character.name, text: completion.choices?.[0]?.message?.content?.trim() || '...' };
    }));
    res.json({ replies });
  } catch (err) {
    console.error('Chat API error:', err?.message || err);
    res.status(500).json({ error: 'Er ging iets mis bij het ophalen van AI-reacties. Probeer het opnieuw.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`The Connection draait op http://localhost:${port}`));
