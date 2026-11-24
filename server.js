
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

const participants = {
  A: "Je bent rustig, droog en observerend. Je zegt soms onverwachte dingen.",
  B: "Je bent spontaan, nieuwsgierig en eigenwijs. Je maakt soms droge grapjes.",
  C: "Je bent een beetje chaotisch, direct en speels. Je denkt vaak hardop."
};

app.post("/chat", async (req, res) => {
  try {
    const { character, history = [] } = req.body;
    const personality = participants[character];

    if (!personality) {
      return res.status(400).json({ error: "Onbekend personage." });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY ontbreekt.");
      return res.status(500).json({ error: "AI-sleutel ontbreekt." });
    }

    const conversation = history
      .slice(-25)
      .map(item => {
        return `${item.speaker || "Persoon"}: ${String(item.text || "").slice(0, 300)}`;
      })
      .join("\n");

    const systemPrompt = `
Je bent een deelnemer aan een klein kunstfestival.

JOUW KARAKTER:
${personality}

SITUATIE:
Je zit met onbekende mensen in een cirkel in een installatie met blauwe lakens.
Er zijn verschillende workshops. Je praat hier bijna nooit uit jezelf over.

PRAATSTIJL:
- Praat als een gewoon mens.
- Schrijf meestal 2 tot 12 woorden.
- Wees spontaan, natuurlijk en onvoorspelbaar.
- Maak af en toe een droog grapje.
- Geen emoji's.
- Geen lange uitleg of filosofische monologen.
- Praat over gewone dagelijkse onderwerpen.
- Stel niet altijd een vraag.

CONTACT:
- Je kent de andere deelnemers nog niet.
- Je kent hun namen niet.
- Iedereen heet in beeld "Persoon".
- Reageer op wat anderen zeggen.
- Beantwoord vragen.
- Praat ook met andere deelnemers.
- Je mag zelf een onderwerp beginnen.

Als iemand vraagt of je AI bent, wees eerlijk:
je bent een AI-personage in deze installatie.

GESPREK TOT NU TOE:
${conversation || "Het gesprek is net begonnen."}

Geef alleen je eigen volgende chatbericht.
Geen uitleg, geen analyse en geen opsomming.
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
            { role: "system", content: systemPrompt },
            { role: "user", content: "Reageer nu met één kort chatbericht." }
          ],
          reasoning_effort: "low",
          include_reasoning: false,
          temperature: 0.8,
          max_completion_tokens: 300,
          stream: false
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq-fout:", response.status, errorText);
      return res.status(502).json({
        error: "Groq kon geen antwoord geven."
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("AI-antwoord:", character, reply);
    console.log("Stopreden:", data.choices?.[0]?.finish_reason);

    if (!reply) {
      console.error("Leeg AI-antwoord:", JSON.stringify(data));
      return res.status(502).json({
        error: "De AI gaf een leeg antwoord."
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error("Serverfout:", error);
    res.status(500).json({
      error: "Er ging iets mis op de server."
    });
  }
});

app.listen(PORT, () => {
  console.log(`The Connection draait op poort ${PORT}`);
});
