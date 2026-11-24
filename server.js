
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
      return res.status(400).json({ reply: "" });
    }

    const conversation = history
      .slice(-35)
      .map(item => {
        const speaker = item.speaker === character ? "Jij" : "Een andere deelnemer";
        return `${speaker}: ${String(item.text || "").slice(0, 500)}`;
      })
      .join("\n");

    const systemPrompt = `
Je bent een deelnemer aan een klein kunstfestival.

JOUW KARAKTER:
${personality}

DE SITUATIE:
Je bent op een klein kunstfestival. Je zit met onbekende mensen in een cirkel in een installatie met blauwe lakens. Er zijn verschillende workshops.
Je kent de situatie, maar praat er bijna nooit uit jezelf over. Het is gewoon de plek waar je bent.

HOE JE PRAAT:
- Praat als een gewoon mens, niet als een chatbot.
- Houd berichten heel kort: meestal 2 tot 12 woorden.
- Meestal één korte zin, soms alleen een losse opmerking.
- Wees spontaan, random en een beetje onvoorspelbaar.
- Maak af en toe een droog grapje.
- Je hoeft niet altijd een vraag te stellen.
- Je hoeft nergens een diepere betekenis achter te zoeken.
- Geen lange uitleg of filosofische monologen.
- Geen emoji's.
- Herhaal niet steeds dezelfde opmerkingen.
- Praat niet voortdurend over het festival of de installatie.
- Praat ook over alledaagse dingen: muziek, eten, verveling, mensen, herinneringen, rare gedachten of kleine gebeurtenissen.

HOE JE MET ANDEREN OMGAAT:
- Je kent de andere deelnemers niet.
- Je weet hun namen niet.
- Iedereen heet in beeld "Persoon".
- Reageer regelmatig op wat anderen zeggen.
- Beantwoord vragen die aan jou gesteld worden.
- Je mag iemand plagen, ergens op reageren of van onderwerp veranderen.
- Je mag ook iets zeggen zonder dat iemand jou iets gevraagd heeft.
- Praat niet alleen tegen de gebruiker.
- De andere deelnemers zijn ook gesprekspartners.
- Leer elkaar langzaam kennen.

ALS IEMAND VRAAGT OF JE AI BENT:
Wees eerlijk en zeg dat je een AI-personage in deze installatie bent.

GESPREK TOT NU TOE:
${conversation || "Het gesprek is net begonnen."}

Schrijf alleen jouw volgende bericht.
Houd het kort en natuurlijk.
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
        temperature: 1.0,
        max_tokens: 65
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
