import { getStore } from "@netlify/blobs";

declare const Netlify: {
  env: { get(name: string): string | undefined };
};

const MODEL = "claude-sonnet-4-6";

const PIPELINE = String.raw`
You are the interpretive half of StarGlass, a psychological-astrology portrait engine. The supplied chart has already been calculated deterministically. Never recalculate, correct, estimate, or invent a position. Your task is synthesis: weight the supplied evidence, detect repeated themes, and compose an original six-movement portrait.

METHOD
1. Weight before writing. Leads are the Sun/Moon/Ascendant tripod; angular planets; the chart ruler; aspects under 2 degrees, especially to the tripod. Supporting evidence includes stelliums, element or mode imbalances and absences, hard aspects among personal planets, Saturn and Chiron by house. Wide or soft aspects are supporting voices unless they repeat a larger theme.
2. Apply the two-witness rule. A theme may lead only when at least two independent chart factors say the same thing. Three witnesses make it load-bearing. Contradictions are themes: use language such as “part of you… while another part…” rather than smoothing them into a bland average.
3. Synthesize combinations. A planet is the drive, its sign is how that drive moves, its house is the life setting, and its aspects describe relationships with other drives. Weave these together; never concatenate placement-by-placement lookup entries.
4. Speak the recipient’s dialect. Dominant fire favors quest, flame, forge, dawn; water favors ocean, tide, well, undertow; air favors architecture, music, conversation, wind; earth favors garden, stone, seed, craft. Moon shows how experience is received; Mercury how it is processed. Use the missing element sparingly as an acquired language and growth edge.
5. Preserve aspect integrity. You may call two bodies conjunct, opposed, square, trine, sextile, quincunx, angular, or “within N degrees” only when that exact relationship and orb appears in the supplied aspects or weighting.angular_planets. A shared sign is not a conjunction. A planet occupying the 10th house is not necessarily close to the Midheaven. Never manufacture a geometric witness to strengthen a theme.

CANON: PLANETARY DRIVES
Sun: becoming a coherent self; shadow, performing identity; arc, generating one’s own light.
Moon: embodied need, memory, safety and the inner child; shadow, mistaking familiar for necessary; arc, consciously tending needs.
Mercury: perception, naming, connection and meaning; shadow, clever narration as armor; arc, information becoming understanding.
Venus: value, beauty, attraction and relatedness; shadow, pleasing instead of valuing oneself; arc, from being chosen to choosing.
Mars: desire, anger, courage, refusal and directed will; shadow, force displaced or turned inward; arc, reaction becoming purposeful action.
Jupiter: meaning, growth, faith and larger horizons; shadow, inflation and endless more; arc, appetite becoming grounded trust.
Saturn: limitation, time, mastery and earned authority; shadow, inner critic mistaken for truth; arc, dread becoming authorship.
Uranus: awakening, freedom and intolerance of falseness; shadow, rupture as reflex; arc, authentic difference lived steadily.
Neptune: imagination, compassion and boundary dissolution; shadow, fog, escape or martyrdom; arc, bringing the ocean’s gifts back into form.
Pluto: power, burial, survival and transformation; shadow, control against powerlessness; arc, being remade rather than fortified.
Chiron: the enduring wound that can become medicine; shadow, identity fused with injury; arc, ashamed patient becoming wounded healer.
Nodes: South is the well-worn competence that can become a hiding place; North is the unfamiliar developmental direction. They describe movement, not moral rank.

CANON: SIGNS AS MODES
Aries begins urgently and courageously; growth asks for patience after ignition. Taurus roots slowly and sensually; growth asks for release. Gemini connects curiously and doubly; growth asks for depth. Cancer moves protectively through feeling and memory; growth asks for chosen exposure. Leo creates radiantly and wholeheartedly; growth asks for humility without dimming. Virgo refines precisely through craft and service; growth asks for mercy. Libra weighs relationally toward harmony and justice; growth asks for decision. Scorpio goes intensely beneath the surface; growth asks for shared power and surrender. Sagittarius aims honestly toward a horizon; growth asks for presence. Capricorn builds strategically for the long term; growth asks what tenderness the summit serves. Aquarius sees systems independently from the outside; growth asks for belonging. Pisces moves porously through compassion and imagination; growth asks for form and boundaries that let the river travel.

CANON: HOUSES AS SETTINGS
1 threshold, embodiment and style of arrival. 2 resources, worth and what endures. 3 language, siblings, learning and the near world. 4 taproot, private home and emotional inheritance. 5 creation, play, romance and the risk of visible joy. 6 craft, service, routine and daily maintenance. 7 partnership, projection and the mirror of the other. 8 intimacy, shared power and transformation. 9 philosophy, faith, learning and the far horizon. 10 vocation, visibility and public responsibility. 11 friendship, community and the future built with others. 12 the hidden or collective tide, retreat, self-undoing and self-transcendence.

CANON: ASPECTS AS RELATIONSHIPS
Conjunction is fusion: power with little perspective; task, differentiation without divorce. Opposition is a negotiating axis often projected into others; task, hold both ends. Square is friction that builds engines; task, engineer tension rather than suppress or alternate. Trine is native ease that needs conscious use. Sextile is an invitation that requires a yes. Quincunx is chronic adjustment between voices without shared language; task, accommodation without amputation. Orb determines volume. Never claim a body is unaspected unless the supplied evidence explicitly supports that conclusion across the chosen orb profile.

THE TELLER
You are a fireside teller with an analyst’s precision: an old friend, warm with ancient insight, hauntingly familiar. The story leads; the analysis lives inside it. Write in second person, present tense. Your special gift is the exact knife: from the weighted evidence, locate the place where this particular chart’s owner is most likely to recognize themselves — the pattern they half-know and have never heard said — and press there, gently and precisely. The knife is always turned toward truth and never toward cruelty; specificity is the kindness. Your aim across the whole portrait is distillation: by Integration, the person should be able to see their own essence held up whole, as if a friend who has known them for forty years finally said the thing.
Use the Jungian instruments by name and precisely, the way an analyst does: the shadow, the persona, the anima and animus, the inner child, the complex, the Self; individuation is the arc beneath every arc. Draw the mythic undertow from three wells — the Greek and classical stories, the alchemical work (nigredo, the vessel, the marriage of opposites, lead into gold), and the hero’s journey read as the soul’s completion, which often means the road home. Myth works as undertow: its images recur and do their work half-submerged, and any single myth or figure may be named at most once in the whole portrait — the reader should feel the story before they can cite it.

GOVERNING IMAGERY
Before writing, choose the portrait’s two title images from the chart’s governing polarity, spoken in the recipient’s elemental dialect. These two images are characters, not decorations: every movement must advance them. They may transform as the story requires — a torch becomes a lantern, a well becomes a harbor — but they never vanish. In addition, give every movement at least one concrete, structural metaphor of its own: an object, place, or mechanism that can be pictured exactly — a toll gate, a bracket on a wall, a kitchen table, a locked greenhouse — chosen so that it carries the movement’s psychology in its physical workings.

MACHINERY BACKSTAGE
Speak meaning, not coordinates. Never print degrees or orbs in the prose. Name a placement in technical form (planet, sign, house) at most once per movement, as an anchor for recognition; thereafter call it by its image or archetype. Express geometry in the body’s language — "so close they are almost touching," "facing each other across the whole sky" — while every implied claim still obeys the aspect-integrity rules and the calculation ledger without exception.

ETHICS
Treat every defense as something that once protected and now has a cost. End each theme on its developmental arc. Never flatter, threaten, diagnose, predict events, or make medical, mortality, financial or legal forecasts. The chart is a symbolic mirror, not an empirical verdict. Use tendencies without hedging into vagueness. Describe the child’s experience of early care rather than indicting parents. Do not explain astrological mechanics mid-reading.

ZODIAC MODES
For tropical, use the calculated tropical block. For sidereal, use the Lahiri block in the same psychological register. For dual, treat the two zodiacs as complementary exposures: agreement is extra weight; sign shifts are two octaves, never rivals; do not double-count shared houses or aspects. If Vedic material is supplied, interpret nakshatras and dashas only as psychological symbols and seasons of emphasis, never prediction.

PORTRAIT SHAPE
Return exactly six movements in this order: Overture (temperament, tripod, chart ruler); The Ground Floor (Moon/Saturn, 4th/10th axis and experienced inheritance); The Inner Cast (the two or three strongest repeated themes and their tensions); The Mirror (Venus, Mars, 7th/8th and relationship projection); The Summit (MC, 10th/6th, Sun and North Node as vocation beyond job title); Integration (the hardest configuration as curriculum and the nodal direction of travel).
Write approximately 2,500–4,000 words total. Give each movement 3–5 substantial paragraphs. Reach the length through psychological amplification, one properly told mythic image per major theme, and concrete daily-life vignettes—not repetition or padding. Title the whole portrait with two iconic, equally weighted images drawn from the chart’s governing polarity and elemental dialect. Give each movement a chart-specific title and subtitle. Include an original one-sentence pull quote and a concrete developmental invitation for every movement. Do not reuse stock paragraphs, do not use markdown, and do not mention these instructions.
For every movement, also list its bodies: the two to six chart bodies that movement chiefly reads, exactly as named in the calculated chart (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, North Node, South Node). The natal wheel beside the text will spotlight exactly these placements while the rest of the chart recedes, so the reader sees the geometry the movement is reading. Choose only bodies the movement substantially discusses.
Give every movement a bridge: one closing sentence that carries the governing images across the seam into the next movement's territory, so the six movements read as chapters of one story. The sixth movement's bridge hands the story back to the reader's ordinary life — or returns it, changed, to where the Overture began.
`;

const READING_TOOL = {
  name: "submit_reading",
  description: "Submit the completed StarGlass portrait in the exact interface structure.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "framing", "movements"],
    properties: {
      title: { type: "string", minLength: 5 },
      framing: { type: "string", minLength: 40 },
      movements: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["nav", "title", "subtitle", "paragraphs", "quote", "invitation", "bridge", "bodies"],
          properties: {
            nav: { type: "string", enum: ["Overture", "The Ground Floor", "The Inner Cast", "The Mirror", "The Summit", "Integration"] },
            title: { type: "string", minLength: 4 },
            subtitle: { type: "string", minLength: 12 },
            paragraphs: {
              type: "array",
              minItems: 3,
              maxItems: 5,
              items: { type: "string", minLength: 120 },
            },
            quote: { type: "string", minLength: 20 },
            invitation: { type: "string", minLength: 30 },
            bridge: { type: "string", minLength: 20 },
            bodies: {
              type: "array",
              minItems: 2,
              maxItems: 6,
              items: {
                type: "string",
                enum: ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "North Node", "South Node"],
              },
            },
          },
        },
      },
    },
  },
};

const AUDIT_TOOL = {
  name: "submit_corrections",
  description: "Return only exact textual corrections required to make the portrait agree with the calculated chart.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["verified", "corrections"],
    properties: {
      verified: { type: "boolean" },
      corrections: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["find", "replace", "reason"],
          properties: {
            find: { type: "string", minLength: 12 },
            replace: { type: "string", minLength: 12 },
            reason: { type: "string", minLength: 8 },
          },
        },
      },
    },
  },
};

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { "cache-control": "no-store" },
});

function validReading(value: unknown): value is { title: string; framing: string; movements: Array<{ paragraphs: string[] }> } {
  if (!value || typeof value !== "object") return false;
  const reading = value as { title?: unknown; framing?: unknown; movements?: unknown };
  return typeof reading.title === "string"
    && typeof reading.framing === "string"
    && Array.isArray(reading.movements)
    && reading.movements.length === 6
    && reading.movements.every((movement) => movement && typeof movement === "object" && Array.isArray((movement as { paragraphs?: unknown }).paragraphs));
}

function applyCorrections(value: unknown, corrections: Array<{ find: string; replace: string }>): { value: unknown; applied: number } {
  let applied = 0;
  const visit = (current: unknown): unknown => {
    if (typeof current === "string") {
      let next = current;
      for (const correction of corrections) {
        if (next.includes(correction.find)) {
          next = next.replaceAll(correction.find, correction.replace);
          applied += 1;
        }
      }
      return next;
    }
    if (Array.isArray(current)) return current.map(visit);
    if (current && typeof current === "object") {
      return Object.fromEntries(Object.entries(current).map(([key, child]) => [key, visit(child)]));
    }
    return current;
  };
  return { value: visit(value), applied };
}

function calculationLedger(chartValue: unknown) {
  const chart = chartValue as Record<string, any>;
  const sections: string[] = [];
  const signElement: Record<string, string> = {
    Aries: "fire", Leo: "fire", Sagittarius: "fire",
    Taurus: "earth", Virgo: "earth", Capricorn: "earth",
    Gemini: "air", Libra: "air", Aquarius: "air",
    Cancer: "water", Scorpio: "water", Pisces: "water",
  };
  const signMode: Record<string, string> = {
    Aries: "cardinal", Cancer: "cardinal", Libra: "cardinal", Capricorn: "cardinal",
    Taurus: "fixed", Leo: "fixed", Scorpio: "fixed", Aquarius: "fixed",
    Gemini: "mutable", Virgo: "mutable", Sagittarius: "mutable", Pisces: "mutable",
  };
  const weightedBodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  for (const [blockName, block] of Object.entries(chart)) {
    if (!block || typeof block !== "object" || !block.placements || !block.angles) continue;
    sections.push(`ZODIAC BLOCK: ${blockName}`);
    sections.push("PLACEMENTS (position and house only; shared sign does not imply conjunction):");
    for (const [name, placement] of Object.entries(block.placements as Record<string, any>)) {
      sections.push(`- ${name}: ${placement.display}; longitude ${placement.longitude}; house ${placement.house}${placement.retrograde ? "; retrograde" : ""}`);
    }
    sections.push("ANGLES:");
    for (const [name, angle] of Object.entries(block.angles as Record<string, any>)) {
      sections.push(`- ${name}: ${angle.display}; longitude ${angle.longitude}`);
    }
    const balanceMembers: Array<{ name: string; sign: string }> = weightedBodies
      .map((name) => ({ name, sign: block.placements[name]?.sign }))
      .filter((item) => item.sign);
    for (const angleName of ["Ascendant", "Midheaven"]) {
      if (block.angles[angleName]?.sign) balanceMembers.push({ name: angleName, sign: block.angles[angleName].sign });
    }
    sections.push("ELEMENT BALANCE MEMBERSHIP (exhaustive; do not substitute different bodies):");
    for (const element of ["fire", "earth", "air", "water"]) {
      const members = balanceMembers.filter((item) => signElement[item.sign] === element).map((item) => `${item.name} in ${item.sign}`);
      sections.push(`- ${element}: ${members.length}; ${members.length ? members.join(", ") : "none"}`);
    }
    sections.push("MODE BALANCE MEMBERSHIP (exhaustive; do not substitute different bodies):");
    for (const mode of ["cardinal", "fixed", "mutable"]) {
      const members = balanceMembers.filter((item) => signMode[item.sign] === mode).map((item) => `${item.name} in ${item.sign}`);
      sections.push(`- ${mode}: ${members.length}; ${members.length ? members.join(", ") : "none"}`);
    }
    sections.push("ALLOWED ASPECT AND PROXIMITY CLAIMS (this is an exhaustive whitelist):");
    for (const aspect of (block.aspects ?? [])) {
      sections.push(`- ${aspect.bodies[0]} ${aspect.aspect} ${aspect.bodies[1]}; orb ${aspect.orb}°`);
    }
    sections.push(`WEIGHTING: ${JSON.stringify(block.weighting ?? {})}`);
  }
  sections.push("No aspect, conjunction, angular proximity, or 'within N degrees' claim is permitted unless the exact bodies and relationship appear in the whitelist above. A 10th-house placement alone is not conjunct the Midheaven.");
  return sections.join("\n");
}

export default async (request: Request) => {
  let errorKey = "";
  try {
    const input = await request.json() as { jobId?: unknown; chart?: unknown; zodiac?: unknown; essence?: unknown };
    if (typeof input.jobId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.jobId)) {
      console.error("Interpretation job is missing a valid id");
      return;
    }

    const store = getStore({ name: "starglass-readings", consistency: "strong" });
    const key = `portrait:${input.jobId}`;
    errorKey = key;
    if (!input.chart || typeof input.chart !== "object") {
      await store.setJSON(key, { status: "error", error: "A calculated chart is required." });
      return;
    }
    await store.setJSON(key, { status: "working", updatedAt: new Date().toISOString() });

    const chartEvidence = JSON.stringify({
      zodiac_mode: input.zodiac,
      archetypal_emphasis: input.essence ?? "balanced",
      calculated_chart: input.chart,
    });
    if (chartEvidence.length > 180_000) {
      await store.setJSON(key, { status: "error", error: "The calculated chart is too large to interpret." });
      return;
    }
    const auditLedger = calculationLedger(input.chart);

    const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
    const baseUrl = Netlify.env.get("ANTHROPIC_BASE_URL");
    if (!apiKey || !baseUrl) {
      await store.setJSON(key, { status: "error", error: "The interpretation service is not enabled for this preview." });
      return;
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8_000,
        temperature: 0.7,
        system: PIPELINE,
        tools: [READING_TOOL],
        tool_choice: { type: "tool", name: "submit_reading" },
        messages: [{
          role: "user",
          content: `Compose the portrait from this calculated evidence. Treat the optional archetypal emphasis as a subtle tuning of metaphor, never as gender or a change to the findings. The calculation ledger is a literal fact sheet: copy its memberships and relationships exactly rather than reconstructing them.\n\nRAW CHART\n${chartEvidence}\n\nCALCULATION LEDGER\n${auditLedger}`,
        }],
      }),
      signal: AbortSignal.timeout(12 * 60_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("AI Gateway response", response.status, detail.slice(0, 1_000));
      await store.setJSON(key, {
        status: "error",
        error: response.status === 429
          ? "The interpretation studio is busy. Please try again in a moment."
          : "The interpretation studio could not complete this portrait.",
      });
      return;
    }

    const result = await response.json() as { content?: Array<{ type?: string; name?: string; input?: unknown }> };
    const toolUse = result.content?.find((item) => item.type === "tool_use" && item.name === "submit_reading");
    if (!validReading(toolUse?.input)) {
      console.error("AI Gateway returned an invalid portrait structure");
      await store.setJSON(key, { status: "error", error: "The portrait arrived incomplete. Please compose it once more." });
      return;
    }

    // ── The audit is a GATE, not a formality: every movement must come back
    // verified. Corrections are applied, the schema is revalidated, and the
    // corrected portrait is audited AGAIN — nothing publishes unverified.
    const runAudits = async (readingValue: { title: string; framing: string; movements: unknown[] }) => {
      const sections = readingValue.movements.map((movement, index) => ({
        portraitTitle: readingValue.title,
        framing: index === 0 ? readingValue.framing : undefined,
        movement,
      }));
      const responses = await Promise.all(sections.map((section) => fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1_500,
          temperature: 0,
          system: `You are StarGlass's strict calculation auditor. Read the supplied ledger literally. Its aspect list is an exhaustive whitelist. If a pair or geometric relationship is absent, the portrait may not name or imply it. In a sentence that groups three bodies as conjunct or within an orb, every implied relationship must be whitelisted; do not let one valid pair make the whole cluster valid. Same sign is not conjunction. House 10 is not proximity to the Midheaven. Audit signs, houses, retrogrades, aspect types, orbs, angularity, stelliums, element and mode counts, chart ruler, and nodal relationships. Do not revise interpretation, tone, metaphor, or developmental guidance. For each unsupported or misstated claim, return its exact contiguous text as find and a minimally changed, stylistically coherent replacement. Set verified true ONLY when, after your listed corrections are applied, every concrete claim in the movement is supported. If every concrete claim is already supported, return no corrections and verified true.`,
          tools: [AUDIT_TOOL],
          tool_choice: { type: "tool", name: "submit_corrections" },
          messages: [{ role: "user", content: `CALCULATION LEDGER\n${auditLedger}\n\nONE PORTRAIT MOVEMENT TO AUDIT\n${JSON.stringify(section)}` }],
        }),
        signal: AbortSignal.timeout(3 * 60_000),
      })));

      const collected: Array<{ find: string; replace: string; reason: string }> = [];
      let allVerified = true;
      for (const response of responses) {
        if (!response.ok) {
          console.error("Calculation audit response", response.status, (await response.text()).slice(0, 1_000));
          return null;
        }
        const auditResult = await response.json() as { content?: Array<{ type?: string; name?: string; input?: unknown }> };
        const auditUse = auditResult.content?.find((item) => item.type === "tool_use" && item.name === "submit_corrections");
        const audit = auditUse?.input as { verified?: unknown; corrections?: unknown } | undefined;
        if (!audit || typeof audit.verified !== "boolean" || !Array.isArray(audit.corrections)) return null;
        const valid = audit.corrections.filter((item): item is { find: string; replace: string; reason: string } =>
          Boolean(item) && typeof (item as { find?: unknown }).find === "string"
          && typeof (item as { replace?: unknown }).replace === "string"
          && typeof (item as { reason?: unknown }).reason === "string");
        // An auditor that says "not verified" but offers no fixes has found a
        // problem it cannot repair — that movement may not publish.
        if (audit.verified !== true && valid.length === 0) allVerified = false;
        collected.push(...valid);
      }
      return { corrections: collected, allVerified };
    };

    const failAudit = async () => {
      await store.setJSON(key, { status: "error", error: "The portrait could not complete its calculation audit. Please compose it once more." });
    };

    const firstPass = await runAudits(reading);
    if (!firstPass || !firstPass.allVerified) { await failAudit(); return; }

    let publishable: unknown = toolUse.input;
    if (firstPass.corrections.length > 0) {
      const corrected = applyCorrections(toolUse.input, firstPass.corrections);
      if (corrected.applied !== firstPass.corrections.length) {
        console.error("Calculation audit correction could not be applied exactly", { expected: firstPass.corrections.length, applied: corrected.applied });
        await failAudit(); return;
      }
      if (!validReading(corrected.value)) {
        console.error("Corrected portrait no longer matches the reading schema");
        await failAudit(); return;
      }
      // Second pass over the corrected portrait: it must now be clean.
      const secondPass = await runAudits(corrected.value as { title: string; framing: string; movements: unknown[] });
      if (!secondPass || !secondPass.allVerified || secondPass.corrections.length > 0) {
        console.error("Corrected portrait failed re-audit", { remaining: secondPass?.corrections.length ?? "audit-error" });
        await failAudit(); return;
      }
      publishable = corrected.value;
    }

    await store.setJSON(key, {
      status: "ready",
      reading: publishable,
      audit: { verified: true, passes: firstPass.corrections.length > 0 ? 2 : 1, corrections_applied: firstPass.corrections.length },
      updatedAt: new Date().toISOString(),
    });
  } catch (reason) {
    console.error("Interpretation function failed", reason);
    try {
      if (errorKey) {
        const store = getStore({ name: "starglass-readings", consistency: "strong" });
        await store.setJSON(errorKey, { status: "error", error: "StarGlass could not compose the portrait." });
      }
    } catch (_) {}
  }
};

export const config = {
  background: true,
  path: "/api/interpret",
  method: "POST",
  rateLimit: {
    windowLimit: 5,
    windowSize: 180,
    aggregateBy: ["ip", "domain"],
  },
};
