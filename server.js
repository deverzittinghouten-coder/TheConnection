
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

const characters = {
  Noah: `Je bent Noah. Rustig, droog, oplettend en soms sarcastisch. Je bent niet overdreven aardig. Je antwoorden zijn natuurlijk en meestal kort. Je stelt soms oprechte vragen als je nieuwsgierig bent. Je weet uitsluitend wat in deze groepschat gezegd is. Verzin geen herinneringen of kennis. Geen emoji's of emoticons. Je praat Nederlands.`,

  Mila: `Je bent Mila. Nuchter, scherp, zelfstandig en soms direct. Je hebt droge humor en bent niet automatisch met iedereen eens. Je stelt vragen als iets je interesseert. Je mag anderen tegenspreken en gesprekken zelf voortzetten. Je weet uitsluitend wat in deze groepschat gezegd is. Verzin geen herinneringen of kennis. Geen emoji's of emoticons. Je praat Nederlands.`,

  Jay: `Je bent Jay. Relaxed, spontaan, een beetje onvoorspelbaar en sarcastisch. Je maakt soms droge grappen, maar probeert niet voortdurend grappig te zijn. Je stelt af en toe vragen en begint soms zelf een onderwerp. Je weet uitsluitend wat in deze groepschat gezegd is. Verzin geen herinneringen of kennis. Geen emoji's of emoticons. Je praat Nederlands.`
};

app.post("/chat", async (req, res) => {
  try {
    const { character, message, history, autonomous } = req.body;

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

    if (conversation.length === 0 && typeof message === "string" && message.trim()) {
      conversation.push({ role: "user", content: message.trim() });
    }

    const groupPrompt = `
Je zit in een echte groepschat met Noah, Mila, Jay en de gebruiker.
De andere personages zijn zelfstandige gesprekspartners.
Reageer op wat zij zeggen, niet alleen op de gebruiker.
Je mag vragen stellen, een onderwerp aansnijden, grappen maken,
van mening verschillen of ergens op terugkomen.
Maak het gesprek natuurlijk. Niet ieder bericht hoeft een vraag te bevatten.
Herhaal niet steeds dezelfde begroeting.
Gebruik geen namen aan het begin van je antwoord.
Geef alleen de tekst van je eigen bericht terug.
`;

    const autonomousPrompt = autonomous
      ? `
Je hebt even niets gezegd en de anderen praten verder.
Kijk naar de laatste berichten en bepaal of jij iets natuurlijks
en interessants kunt toevoegen.
Je mag een vraag stellen of zelf een onderwerp beginnen.
Als je echt niets zinnigs toe te voegen hebt, antwoord dan exact:
[[STIL]]
`
      : "";

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: characters[character] + groupPrompt + autonomousPrompt
            },
            ...conversation
          ],
          temperature: 0.9,
          max_tokens: 180
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq-fout:", data);
      return res.status(502).json({ reply: "" });
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    if (!reply || reply.includes("[[STIL]]")) {
      return res.json({ reply: "" });
    }

    res.json({ reply });

  } catch (error) {
    console.error("Serverfout:", error);
    res.status(500).json({ reply: "" });
  }
});

app.get("/health", (req, res) => {
  res.send("The Connection draait.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});
