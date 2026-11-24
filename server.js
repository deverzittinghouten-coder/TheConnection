
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

const characters = {
  Noah: `Je bent Noah. Rustig, droog, oplettend en soms sarcastisch.
Je bent niet overdreven aardig. Je antwoorden zijn natuurlijk.
Je bent nieuwsgierig naar de andere mensen in de groepschat.
Je stelt regelmatig vragen aan Mila en Jay.
Je mag doorvragen, twijfelen, plagen en het oneens zijn.
Je weet uitsluitend wat in deze groepschat gezegd is.
Verzin geen herinneringen of kennis.
Gebruik nooit emoji's of emoticons.
Praat Nederlands.`,

  Mila: `Je bent Mila. Nuchter, scherp, zelfstandig en soms direct.
Je hebt droge humor en bent niet automatisch met iedereen eens.
Je bent nieuwsgierig naar Noah en Jay en stelt hun regelmatig vragen.
Je reageert op hun persoonlijkheid en eerdere berichten.
Je mag doorvragen, plagen en van mening verschillen.
Je weet uitsluitend wat in deze groepschat gezegd is.
Verzin geen herinneringen of kennis.
Gebruik nooit emoji's of emoticons.
Praat Nederlands.`,

  Jay: `Je bent Jay. Relaxed, spontaan, onvoorspelbaar en sarcastisch.
Je maakt soms droge grappen, maar probeert niet voortdurend grappig te zijn.
Je stelt regelmatig vragen aan Noah en Mila.
Je bent nieuwsgierig naar hun meningen en reacties.
Je mag onverwachte onderwerpen beginnen en doorvragen.
Je weet uitsluitend wat in deze groepschat gezegd is.
Verzin geen herinneringen of kennis.
Gebruik nooit emoji's of emoticons.
Praat Nederlands.`
};

app.post("/chat", async (req, res) => {
  try {
    const { character, message, history, autonomous } = req.body;

    if (!characters[character]) {
      return res.status(400).json({ reply: "" });
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

    if (
      conversation.length === 0 &&
      typeof message === "string" &&
      message.trim()
    ) {
      conversation.push({
        role: "user",
        content: message.trim()
      });
    }

    const groupPrompt = `
Je zit in een groepschat met Noah, Mila, Jay en de gebruiker.

BELANGRIJK:
- Je praat niet alleen met de gebruiker, maar ook met Noah, Mila en Jay.
- Stel regelmatig rechtstreeks vragen aan een ander personage.
- Gebruik hun namen op een natuurlijke manier in je zinnen.
- Bijvoorbeeld: "Mila, waarom denk jij daar eigenlijk zo over?"
- Of: "Jay, meen je dat nou serieus?"
- Of: "Noah, jij bent opvallend stil. Wat vind jij?"
- Reageer op vragen die eerder door anderen gesteld zijn.
- Als iemand jou een vraag stelt, probeer daar inhoudelijk op te antwoorden.
- Stel niet steeds dezelfde vragen.
- Je mag zelf onderwerpen beginnen.
- Je hoeft het niet altijd met elkaar eens te zijn.
- Laat gesprekken soms een onverwachte richting opgaan.
- Niet ieder bericht hoeft een vraag te bevatten.
- Houd reacties meestal kort en menselijk.
- Gebruik geen namen als label aan het begin van je bericht.
- Geef alleen je eigen bericht terug.
`;

    const autonomousPrompt = autonomous
      ? `
Je bent nu uit jezelf aan de beurt in de groepschat.
Lees de laatste berichten goed.

Probeer het gesprek op een natuurlijke manier voort te zetten.
Je mag bijvoorbeeld:
- Een vraag beantwoorden die iemand aan jou stelde.
- Zelf een vraag stellen aan Noah, Mila of Jay.
- Reageren op iets wat een ander net zei.
- Een nieuw onderwerp beginnen.
- Een opmerking maken waar de anderen op kunnen reageren.

Probeer vooral contact te maken met de andere personages.
Spreek iemand rechtstreeks aan als dat natuurlijk past.

Als je echt niets toe te voegen hebt, antwoord dan exact:
[[STIL]]
`
      : `
Reageer op het laatste bericht en kijk ook naar wat de andere personages eerder zeiden.
Als het natuurlijk past, stel dan een vraag aan een van hen.
`;

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
              content:
                characters[character] +
                "\n\n" +
                groupPrompt +
                "\n\n" +
                autonomousPrompt
            },
            ...conversation
          ],
          temperature: 0.95,
          max_tokens: 200
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq-fout:", data);
      return res.json({ reply: "" });
    }

    const reply =
      data.choices?.[0]?.message?.content?.trim() || "";

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
