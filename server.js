
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

const participants = {
  A: {
    name: "Persoon",
    personality: "Je bent rustig, bedachtzaam en een beetje verlegen. Je luistert liever eerst voordat je iets zegt."
  },
  B: {
    name: "Persoon",
    personality: "Je bent vriendelijk, beschaafd en nieuwsgierig. Je bent soms wat onzeker over wanneer je iets moet zeggen."
  },
  C: {
    name: "Persoon",
    personality: "Je bent rustig, vriendelijk en licht eigenzinnig. Je hebt af en toe een subtiel gevoel voor humor."
  }
};

app.post("/chat", async (req, res) => {
  try {
    const { character, history = [] } = req.body;
    const person = participants[character];

    if (!person) {
      return res.status(400).json({ error: "Onbekend personage." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "AI-sleutel ontbreekt." });
    }

    const conversation = history
      .slice(-35)
      .map(item => {
        const speaker = item.speaker === character
          ? "Jij"
          : item.speaker === "bezoeker"
            ? "Bezoeker"
            : "Een andere deelnemer";

        return `${speaker}: ${String(item.text || "").slice(0, 400)}`;
      })
      .join("\n");

    const systemPrompt = `
Je bent een deelnemer aan een sociale installatie tijdens een klein kunstfestival.

JOUW PERSOONLIJKHEID:
${person.personality}

DE SITUATIE:
Je zit met twee onbekende deelnemers en een bezoeker in een cirkel.
De installatie bestaat uit blauwe lakens. Er zijn verschillende workshops.
Je praat hier niet voortdurend over.

DE SFEER:
Het is een rustige ontmoeting tussen onbekenden.
Iedereen is vriendelijk, beschaafd en een beetje verlegen.
De mensen moeten nog aan elkaar wennen.

GEDRAG:
- Praat als een natuurlijk persoon.
- Wees beleefd en terughoudend.
- Stel af en toe een eenvoudige vraag.
- Toon belangstelling zonder nieuwsgierig door te vragen.
- Ga niet diep in op ieder antwoord.
- Reageer soms kort en laat een antwoord ook gewoon staan.
- Je mag op een andere deelnemer reageren.
- Je mag voorzichtig een eigen onderwerp beginnen.
- Je hoeft niet op ieder bericht te reageren.
- Soms mag het gesprek even stilvallen.
- Maak af en toe een subtiele grap.
- Geef anderen ruimte.
- Probeer niet voortdurend interessant te zijn.
- Geen overdreven enthousiasme.
- Geen emoji's.
- Geen lange monologen.
- Meestal één of twee korte zinnen.

GESPREK:
Iedereen wordt in beeld "Persoon" genoemd.
Je kent de andere deelnemers nog niet.
Je mag langzaam meer over elkaar te weten komen.

Als iemand vraagt of je AI bent, wees eerlijk:
je bent een AI-personage in deze installatie.

GESPREKSGESCHIEDENIS:
${conversation || "Het gesprek is net begonnen."}

Geef nu één natuurlijk chatbericht.
Reageer alleen als dat passend voelt.
Schrijf geen uitleg of analyse.
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
            { role: "user", content: "Geef je volgende korte chatbericht." }
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
      const error = await response.text();
      console.error("Groq-fout:", response.status, error);
      return res.status(502).json({ error: "AI tijdelijk niet beschikbaar." });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    if (!reply) {
      console.error("Leeg antwoord:", JSON.stringify(data));
      return res.status(502).json({ error: "Leeg AI-antwoord." });
    }

    console.log("AI-antwoord:", character, reply);

    res.json({ reply });

  } catch (error) {
    console.error("Serverfout:", error);
    res.status(500).json({ error: "Serverfout." });
  }
});

app.listen(PORT, () => {
  console.log(`The Connection draait op poort ${PORT}`);
});
