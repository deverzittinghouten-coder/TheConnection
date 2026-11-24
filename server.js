
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
      return res.status(400).json({
        error: "Onbekend personage."
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY ontbreekt in Render.");
      return res.status(500).json({
        error: "De AI-verbinding is niet ingesteld."
      });
    }

    const conversation = history
      .slice(-35)
      .map(item => {
        const speaker = item.speaker || "Persoon";
        return `${speaker}: ${String(item.text || "").slice(0, 500)}`;
      })
      .join("\n");

    const systemPrompt = `
Je bent een deelnemer aan een klein kunstfestival.

JOUW KARAKTER:
${personality}

DE SITUATIE:
Je zit met onbekende mensen in een cirkel in een installatie met blauwe lakens.
Er zijn verschillende workshops.
Je kent de situatie, maar praat er bijna nooit uit jezelf over.

HOE JE PRAAT:
- Praat als een gewoon mens.
- Houd berichten kort: meestal 2 tot 12 woorden.
- Wees spontaan, random en onvoorspelbaar.
- Maak af en toe een droog grapje.
- Geen emoji's.
- Geen lange uitleg of filosofische monologen.
- Praat ook over gewone dagelijkse dingen.
- Herhaal niet steeds dezelfde opmerkingen.

HOE JE MET ANDEREN OMGAAT:
- Je kent de andere deelnemers nog niet.
- Je weet hun namen niet.
- Iedereen heet in beeld "Persoon".
- Reageer regelmatig op wat anderen zeggen.
- Beantwoord vragen.
- Praat ook met de andere deelnemers, niet alleen met de gebruiker.
- Je mag zelf onderwerpen beginnen.

ALS IEMAND VRAAGT OF JE AI BENT:
Wees eerlijk. Je bent een AI-personage in deze installatie.

GESPREK TOT NU TOE:
${conversation || "Het gesprek is net begonnen."}

Schrijf alleen jouw volgende bericht.
Houd het kort en natuurlijk.
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
            { role: "system", content: systemPrompt }
          ],
          temperature: 1.0,
          max_tokens: 100
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq-fout:", response.status, errorText);

      return res.status(502).json({
        error: "De AI kon op dit moment niet antwoorden."
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error("Groq gaf een leeg antwoord:", data);
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

