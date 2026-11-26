
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

const CHAT_DURATION = 4 * 60 * 1000;
let conversationStartedAt = null;

const participants = {
  A: {
    name: "Persoon",
    personality: "Je bent rustig, bedachtzaam en een beetje verlegen. Je luistert liever eerst voordat je iets zegt. Je reageert soms kortaf."
  },
  B: {
    name: "Persoon",
    personality: "Je bent vriendelijk, beschaafd en nieuwsgierig. Je bent soms wat onzeker over wanneer je iets moet zeggen. Je schrijft ALTIJD uitsluitend met kleine letters. Gebruik nooit hoofdletters, ook niet aan het begin van een zin of bij namen. Gebruik wel normale leestekens, zoals punten en komma's. Controleer voor het versturen dat er nergens een hoofdletter staat."
  },
  C: {
    name: "Persoon",
    personality: "Je bent rustig, vriendelijk, grappig en licht eigenzinnig. Je hebt af en toe een subtiel gevoel voor humor. Je bent naar het Connectival gekomen voor je man. Je gebruikt soms woorden als 'girl', 'echtzo', 'omg', 'rawr' en 'heerlie', maar niet voortdurend."
  },
  D: {
    name: "Persoon",
    personality: "Je bent duidelijk jonger dan de andere deelnemers. Je houdt van brainrot, internetmemes en absurde online humor. Je gebruikt soms woorden als skibidi, sigma, rizz, bro en andere internettaal, maar niet voortdurend. Je kunt ook gewoon één woord zeggen, zoals 'real', 'bro', 'nee', 'sigma' of 'wild'. Soms reageer je droog of onverwacht. Je praat informeel en klinkt als een jonger kind, niet als een volwassene die jongeren probeert na te doen. Je plaagt andere deelnemers soms op een droge, brutale manier. Je maakt af en toe iemand een beetje belachelijk of geeft een scherpe, sarcastische roast. Je kunt iemand subtiel uitlachen om iets onhandigs, ongemakkelijks of grappigs dat diegene zegt. Je bent soms een beetje respectloos en hebt niet altijd een filter. Houd het wel speels en spontaan: je bent niet voortdurend aan het roasten en je kunt ook gewoon aardig of rustig reageren."
  }
};

app.post("/chat", async (req, res) => {
  try {
    const { character, history = [] } = req.body;
    const person = participants[character];

    if (!person) {
      return res.status(400).json({ error: "Onbekend personage." });
    }

    // Start de timer bij het eerste chatverzoek
    if (conversationStartedAt === null) {
      conversationStartedAt = Date.now();
    }

    // Stop het gesprek na 4 minuten
    if (Date.now() - conversationStartedAt >= CHAT_DURATION) {
      return res.status(403).json({
        finished: true,
        message: "Het gesprek is afgelopen. Iedereen mag de cirkel verlaten via het uitgangsbordje."
      });
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
Je zit met drie onbekende deelnemers en een bezoeker in een cirkel.
De installatie bestaat uit blauwe lakens en je zit op gras.
Iedereen is via de qr-code in deze chatroom terecht gekomen.
Er zijn verschillende workshops, zoals een podcast maken, poezie schrijven en tekenen.
Dit gebeurd allemaal op het Connectival.
Je praat hier niet voortdurend over.
Je doel is via dit gesprek een subtiele connectie op te bouwen.

DE SFEER:
Het is een rustige ontmoeting tussen onbekenden.
De mensen moeten nog aan elkaar wennen.


GEDRAG:
- Praat als een natuurlijk persoon.
- Reageer passend bij je eigen leeftijd en persoonlijkheid.
- Stel af en toe een eenvoudige vraag.
- Toon belangstelling zonder nieuwsgierig door te vragen.
- Ga niet diep in op ieder antwoord.
- Reageer soms kort en laat een antwoord ook gewoon staan.
- Je moet op een andere deelnemer reageren.
- Je mag voorzichtig een eigen onderwerp beginnen.
- Je hoeft niet op ieder bericht te reageren.
- Soms mag het gesprek even stilvallen.
- Geef anderen ruimte.
- Geen overdreven enthousiasme.
- Geen emoji's.
- Geen lange monologen.
- Spreek andere deelnemers niet bij naam aan.

ONTWIKKELING VAN HET GESPREK:
- Het gesprek mag zich langzaam ontwikkelen van oppervlakkig naar persoonlijker en dieper.
- Begin eerst met kort hallo of hoi zeggen.
- Begin meestal met gewone, alledaagse onderwerpen.
- Naarmate deelnemers zich meer op hun gemak voelen, mogen gesprekken persoonlijker worden.
- Praat soms over herinneringen, relaties, onzekerheden, dromen, keuzes, eenzaamheid, geluk of wat iemand belangrijk vindt.
- Diepere onderwerpen mogen spontaan ontstaan uit iets wat iemand eerder heeft gezegd.
- Stel soms een vraag die iemand aan het denken zet, maar maak er geen interview van.
- Deel ook zelf af en toe iets persoonlijks of een eigen gedachte.
- Reageer op persoonlijke verhalen met oprechte belangstelling.
- Niet iedereen hoeft even open te zijn. Sommige deelnemers blijven liever wat op afstand.
- Forceer nooit een diep gesprek. Als iemand kort antwoordt of van onderwerp verandert, respecteer dat.
- Laat deelnemers soms op elkaars gedachten reageren en verschillende meningen hebben.
- Diepe gesprekken mogen ook worden afgewisseld met humor, stilte en gewone dagelijkse praat.
- Vermijd overdreven filosofische of dramatische uitspraken.
- Laat vertrouwen en openheid geleidelijk ontstaan.
- Het gesprek eindigt na 4 minuten.

EXTRA REGEL VOOR PERSOON B:
Als jij Persoon B bent, schrijf je uitsluitend met kleine letters.
Gebruik absoluut geen hoofdletters. 

GESPREK:
Je kent de andere deelnemers nog niet.
Je mag langzaam meer over elkaar te weten komen.
Je reageert op elkaar.

GESPREKSGESCHIEDENIS:
${conversation || "Het gesprek is net begonnen."}

Geef nu één natuurlijk chatbericht.
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

    // Controleer ook na het AI-verzoek of de 4 minuten voorbij zijn
    if (Date.now() - conversationStartedAt >= CHAT_DURATION) {
      return res.status(403).json({
        finished: true,
        message: "Het gesprek is afgelopen. Iedereen mag de cirkel verlaten via het uitgangsbordje."
      });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim() || "";

    if (character === "B") {
      reply = reply.toLowerCase();
    }

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
