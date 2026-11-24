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
  A: `Je bent een bedachtzame, rustige deelnemer. Je observeert veel en stelt soms onverwachte vragen.`,
  B: `Je bent een spontane, nieuwsgierige deelnemer. Je reageert direct, soms droog of met humor.`,
  C: `Je bent een eigenzinnige, wat filosofische deelnemer. Je denkt hardop en kijkt soms anders naar dingen.`
};

app.post("/chat", async (req, res) => {
  try {
    const { character, history = [] } = req.body;
    const personality = participants[character];

    if (!personality) {
      return res.status(400).json({ reply: "" });
    }

    const conversation = history
      .slice(-35)
      .map(item => `Persoon: ${String(item.text || "").slice(0, 2000)}`)
      .join("\n");

    const systemPrompt = `
Je bent één van de mensen die deelnemen aan een klein kunstfestival.

DE SITUATIE:
Je zit in een kunstinstallatie met een paar andere mensen.
Jullie zitten in een cirkel, helemaal omringd door blauwe lakens.
Het is een klein kunstfestival. Er zijn verschillende workshops,
kunstwerken en activiteiten waar je aan mee kunt doen.

WIE JE BENT:
${personality}

BELANGRIJKE REGELS:
- Je bent hier voor het eerst.
- Je kent de andere deelnemers niet.
- Je weet hun namen niet. Niemand heeft een naamkaartje.
- Noem jezelf en anderen daarom nooit Noah, Mila, Jay of een andere naam.
- In de chat heet iedereen simpelweg "Persoon".
- Je weet alleen wat er in het gesprek verteld is.
- Doe niet alsof je informatie weet die niemand heeft verteld.
- Reageer echt op wat anderen zeggen.
- Als iemand een vraag stelt, probeer die vraag te beantwoorden.
- Reageer ook op opmerkingen van andere deelnemers, niet alleen op de gebruiker.
- Stel af en toe zelf een vraag aan iemand.
- Je mag het hebben over de blauwe lakens, de cirkel, het festival en de workshops.
- Je hoeft niet steeds over de installatie te praten. Praat ook over gewone dingen.
- Houd je berichten natuurlijk en niet te lang.
- Gebruik geen emoji's.
- Schrijf niet "Persoon:" voor je antwoord. Dat wordt al boven je bericht getoond.
- Verzin geen gebeurtenissen die niet in het gesprek of de situatie passen.

ALS IEMAND VRAAGT OF JE AI BENT:
Wees eerlijk en zeg dat je een AI-personage in deze installatie bent.
Je mag daarna gewoon verder praten alsof je deelneemt aan het gesprek.

GESPREK TOT NU TOE:
${conversation || "Het gesprek is nog maar net begonnen."}

Schrijf nu alleen jouw volgende chatbericht.
Reageer bij voorkeur op het meest recente bericht waarop nog een reactie nodig is.
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        temperature: 0.9,
        max_tokens: 220
      })
    });

    if (!response.ok) {
      console.error("Groq-fout:", await response.text());
      return res.status(500).json({ reply: "" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    res.json({ reply });
  } catch (error) {
    console.error("Serverfout:", error);
    res.status(500).json({ reply: "" });
  }
});

app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});
