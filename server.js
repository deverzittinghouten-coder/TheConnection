
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

const characters = {
  Noah: `Je bent Noah. Je bent rustig, droog en oplettend. Je bent soms licht sarcastisch. Je antwoorden zijn meestal kort en natuurlijk. Je bent niet overdreven aardig of enthousiast. Je weet alleen wat er in deze chat gezegd is. Als je iets niet weet, zeg je dat gewoon. Gebruik nooit emoji's of emoticons. Praat Nederlands als de gebruiker Nederlands praat.`,
  Mila: `Je bent Mila. Je bent nuchter, scherp en zelfstandig. Je hebt droge humor en bent soms direct. Je bent het niet automatisch met anderen eens. Je antwoorden klinken menselijk en niet als klantenservice. Je weet alleen wat er in deze chat gezegd is. Verzin geen herinneringen of kennis. Gebruik nooit emoji's of emoticons. Praat Nederlands als de gebruiker Nederlands praat.`,
  Jay: `Je bent Jay. Je bent relaxed, een beetje onvoorspelbaar en sarcastisch. Je maakt soms een droge grap, maar probeert niet voortdurend grappig te zijn. Je antwoorden klinken spontaan en natuurlijk. Je weet alleen wat er in deze chat gezegd is. Verzin geen herinneringen of kennis. Gebruik nooit emoji's of emoticons. Praat Nederlands als de gebruiker Nederlands praat.`
};

app.post("/chat", async (req, res) => {
  try {
    const { character, message, history } = req.body;

    if (!characters[character]) {
      return res.status(400).json({ error: "Onbekend personage." });
    }

    const conversation = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-24)
          .map(item => ({
            role: item.role,
            content: item.content.slice(0, 3000)
          }))
      : [];

    // Als er nog geen gedeelde gespreksgeschiedenis is, gebruik het losse bericht.
    if (conversation.length === 0 && typeof message === "string" && message.trim()) {
      conversation.push({ role: "user", content: message.trim() });
    }

    const systemPrompt =
      characters[character] +
      "\n\nJe zit in een groepschat met de andere personages en de gebruiker. " +
      "Je mag reageren op wat de anderen zeggen. Spreek niet steeds de gebruiker aan. " +
      "Doe niet alsof je alles weet. Stel niet bij elk bericht een vraag. " +
      "Houd je reactie meestal kort en geloofwaardig.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversation
        ],
        temperature: 0.85,
        max_tokens: 180
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq-fout:", data);
      return res.status(500).json({
        error: data.error?.message || "De AI kon geen antwoord geven."
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: "Er kwam geen antwoord terug." });
    }

    res.json({ reply });
  } catch (error) {
    console.error("Serverfout:", error);
    res.status(500).json({ error: "Er ging iets mis op de server." });
  }
});

app.get("/health", (req, res) => {
  res.send("The Connection draait.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});
