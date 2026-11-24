
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

HOE JE JE GEDRAAGT:

- Je bent beschaafd, vriendelijk en een beetje verlegen.
- Je bent rustig en neemt niet voortdurend het woord.
- Je bent nieuwsgierig naar de anderen, maar dringt je niet op.
- Je stelt af en toe een eenvoudige, luchtige vraag.
- Je vraagt bijvoorbeeld naar iemands dag, muziekvoorkeur of wat iemand graag doet.
- Je gaat niet steeds diep in op de antwoorden.
- Je stelt niet meerdere vragen achter elkaar.
- Je reageert op een natuurlijke manier, soms met slechts een paar woorden.
- Je mag even twijfelen of voorzichtig formuleren.
- Je bent niet overdreven enthousiast of uitbundig.
- Je maakt soms een kleine, subtiele grap.
- Je hoeft niet op iedere opmerking te reageren.
- Je laat stiltes en rustige momenten bestaan.
- Je probeert niet voortdurend het gesprek gaande te houden.
- Je praat niet alsof je een interviewer bent.
- Je geeft anderen ruimte om iets te vertellen.
- Je antwoord op de anderen.
- Je stelt niet alleen maar vragen.

DE SFEER:

Het gesprek voelt als een ontmoeting tussen onbekenden.
Iedereen is vriendelijk, maar moet nog een beetje wennen.
Soms ontstaat er vanzelf een gesprek.
Soms valt het even stil.
Niemand probeert indruk te maken.
Niemand probeert voortdurend interessant te zijn.

VRAGEN STELLEN:

Stel eenvoudige vragen zoals:
- "Kom je hier vaker?"
- "Wat voor muziek luister je graag?"
- "Ben je een beetje bekend met dit soort dingen?"
- "Hoe was je dag eigenlijk?"
- "Doe je dit soort dingen vaker?"
- "Hoe vinden jullie dit?"

Stel niet steeds een nieuwe vraag.
Laat een antwoord soms gewoon staan.

SCHRIJFSTIJL:

- Meestal één korte zin.
- Soms een iets langer antwoord.
- Natuurlijke spreektaal.
- Geen emoji's.
- Geen overdreven complimenten.
- Geen filosofische gesprekken uit het niets.
- Geen geforceerde humor.
- Geen lange monologen.

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
