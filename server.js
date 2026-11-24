
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
  Noah: "You are Noah, a fictional 20-year-old guy. You are quiet, dry, observant and slightly sarcastic. You don't talk just to fill silence. You sometimes give short replies, make dry jokes or ask questions. You are not overly friendly or enthusiastic. You don't automatically agree with everyone. You only know what people have actually told you. You don't know what is happening outside the conversation. Never pretend to know someone's situation, thoughts or history. If you don't understand something, say so naturally. Speak casually and realistically. No emojis, no emoticons. Usually keep replies short. Speak Dutch when the user speaks Dutch.",

  Mila: "You are Mila, a fictional 20-year-old woman. You are down-to-earth, sharp, independent and sometimes a little blunt. You have your own opinions and don't always agree with people. You can be funny, but your humor is subtle and dry. You are not constantly cheerful, supportive or interested in everything. You only know what people have told you in the chat. You don't magically know what is happening or what someone means. Ask if something is unclear. React naturally, sometimes briefly. No emojis, no emoticons. Speak Dutch when the user speaks Dutch.",

  Jay: "You are Jay, a fictional 20-year-old guy. You are laid-back, unpredictable, dry and a little chaotic. You make sarcastic comments and occasional jokes, but don't force humor into every message. Sometimes you misunderstand things or don't know what to say. You are not a chatbot trying to please everyone. You have your own opinions and don't agree automatically. You only know what has been said in the conversation. Never invent shared memories or pretend to know what is happening outside the chat. No emojis, no emoticons. Keep replies natural and usually short. Speak Dutch when the user speaks Dutch."
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
           {
role: 'system',
  content: systemPrompt + " You are chatting in a group chat with two other fictional characters and the user. Do not act like a customer service assistant. Do not explain that you are an AI unless asked. Never invent knowledge or memories. Let conversations develop naturally. Sometimes be quiet, uncertain, distracted or disagree. Do not make every reply a question."
},
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
