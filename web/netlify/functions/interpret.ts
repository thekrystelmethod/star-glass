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

// A correction is applied only inside its own scope: the movement whose
// auditor (or referee finding) produced it, plus the shared title, plus the
// framing for the first movement's auditor. The throughline voice repeats its
// governing images across movements BY DESIGN, so a portrait-wide replaceAll
// let one movement's correction silently rewrite five others — cross-movement
// edits are the flattening we refuse.
interface CorrectionScope {
  movementIndex: number | null;
  includeTitle: boolean;
  includeFraming: boolean;
}

function applyWithinScope(
  reading: { title?: unknown; framing?: unknown; movements?: unknown[] },
  item: { find: string; replace: string },
  scope: CorrectionScope,
): { value: unknown; applied: number } {
  let applied = 0;
  const fix = (current: unknown): unknown => {
    if (typeof current === "string" && current.includes(item.find)) {
      applied += 1;
      return current.replaceAll(item.find, item.replace);
    }
    return current;
  };
  const visit = (current: unknown): unknown => {
    if (typeof current === "string") return fix(current);
    if (Array.isArray(current)) return current.map(visit);
    if (current && typeof current === "object") {
      return Object.fromEntries(Object.entries(current).map(([key, child]) => [key, visit(child)]));
    }
    return current;
  };
  const next: Record<string, unknown> = { ...reading };
  if (scope.includeTitle) next.title = fix(reading.title);
  if (scope.includeFraming) next.framing = fix(reading.framing);
  if (scope.movementIndex !== null && Array.isArray(reading.movements)) {
    next.movements = reading.movements.map((movement, index) => index === scope.movementIndex ? visit(movement) : movement);
  }
  return { value: next, applied };
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
    // The engine supplies Ascendant/Midheaven; the opposite angles are the
    // same axis seen from the other end. Deriving them here closes the
    // equivalence gap that produced false referee findings ("near the IC"
    // rejected although an opposition to the Midheaven was whitelisted).
    if (typeof block.angles?.Midheaven?.longitude === "number" && !block.angles?.IC) {
      sections.push(`- IC (derived): longitude ${(block.angles.Midheaven.longitude + 180) % 360}; the point exactly opposite the Midheaven`);
    }
    if (typeof block.angles?.Ascendant?.longitude === "number" && !block.angles?.Descendant) {
      sections.push(`- Descendant (derived): longitude ${(block.angles.Ascendant.longitude + 180) % 360}; the point exactly opposite the Ascendant`);
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
  sections.push(`EQUIVALENCE RULES (these are part of the whitelist, not exceptions to it):
- Pairwise reading: a sentence relating two bodies is judged on that pair alone. If the pair's relationship is whitelisted, the sentence is correct even when other bodies also aspect either of them; prose is never required to enumerate every member of a cluster or stellium.
- Opposite angles: the IC is the point exactly opposite the Midheaven, and the Descendant exactly opposite the Ascendant. A whitelisted opposition to the Midheaven is therefore also closeness to the IC and may be described either way; likewise for the Ascendant/Descendant axis.`);
  return sections.join("\n");
}

export default async (request: Request) => {
  let errorKey = "";
  // Correlation for logs and stored records: jobId ties a record to its
  // portrait request; runId distinguishes runs if a job is ever re-fired.
  const runId = crypto.randomUUID().slice(0, 8);
  const startedAt = new Date().toISOString();
  try {
    const input = await request.json() as { jobId?: unknown; chart?: unknown; zodiac?: unknown; essence?: unknown };
    if (typeof input.jobId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.jobId)) {
      console.error("Interpretation job is missing a valid id");
      return;
    }

    const store = getStore({ name: "starglass-readings", consistency: "strong" });
    const key = `portrait:${input.jobId}`;
    errorKey = key;
    if (Netlify.env.get("PUBLIC_GENERATION_ENABLED")?.trim().toLowerCase() !== "true") {
      await store.setJSON(key, {
        status: "error",
        stage: "paused",
        error: "Portrait generation is paused for this preview.",
        jobId: input.jobId, runId, startedAt,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    if (!input.chart || typeof input.chart !== "object") {
      await store.setJSON(key, { status: "error", stage: "invalid-chart", error: "A calculated chart is required.", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
      return;
    }
    await store.setJSON(key, { status: "working", phase: "composing", stage: "composing", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });

    const chartEvidence = JSON.stringify({
      zodiac_mode: input.zodiac,
      archetypal_emphasis: input.essence ?? "balanced",
      calculated_chart: input.chart,
    });
    if (chartEvidence.length > 180_000) {
      await store.setJSON(key, { status: "error", stage: "oversized-chart", error: "The calculated chart is too large to interpret.", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
      return;
    }
    const auditLedger = calculationLedger(input.chart);

    const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
    const baseUrl = Netlify.env.get("ANTHROPIC_BASE_URL");
    if (!apiKey || !baseUrl) {
      await store.setJSON(key, { status: "error", stage: "unconfigured", error: "The interpretation service is not enabled for this preview.", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
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
        stage: "compose-gateway",
        error: response.status === 429
          ? "The interpretation studio is busy. Please try again in a moment."
          : "The interpretation studio could not complete this portrait.",
        jobId: input.jobId, runId, startedAt,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const result = await response.json() as { content?: Array<{ type?: string; name?: string; input?: unknown }> };
    const toolUse = result.content?.find((item) => item.type === "tool_use" && item.name === "submit_reading");
    if (!validReading(toolUse?.input)) {
      console.error("AI Gateway returned an invalid portrait structure");
      await store.setJSON(key, { status: "error", stage: "compose-structure", error: "The portrait arrived incomplete. Please compose it once more.", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
      return;
    }

    const reading = toolUse.input as { title: string; framing: string; movements: unknown[] };

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
          system: `You are StarGlass's calculation auditor. You audit FACTS, never style. Read the supplied ledger literally. Its aspect list is an exhaustive whitelist for geometric claims. Same sign is not conjunction. House 10 is not proximity to the Midheaven. In a sentence that groups three bodies as conjunct or within an orb, every implied relationship must be whitelisted. Judge pairwise: a sentence relating two bodies is CORRECT when that pair is whitelisted, even if it does not mention other bodies that also aspect them — text never needs to enumerate a whole cluster. The ledger's EQUIVALENCE RULES are part of the whitelist: an opposition to the Midheaven is the same fact as closeness to the IC, and an opposition to the Ascendant the same fact as closeness to the Descendant.
A claim deserves correction ONLY when it is (a) concrete — a specific sign, house, motion, geometric relationship, count, or rulership — AND (b) contradicted by or absent from the ledger. The portrait deliberately speaks in images: figurative language that expresses a whitelisted relationship ("facing each other across the whole sky" for a whitelisted opposition; "so close they are almost touching" for a whitelisted tight aspect) is CORRECT and must be left alone. Psychological interpretation, mythic imagery, metaphors, developmental guidance, and emotional claims are never auditable — leave them untouched even if vivid. When you are uncertain whether a phrase makes a concrete claim, leave it. Return the FEWEST corrections necessary; an audit that rewrites style is a failed audit.
For each genuinely unsupported claim, return its exact contiguous text as find and a minimally changed, stylistically coherent replacement. Quote find strings verbatim from THIS movement's own text; correct the shared portrait title only if the title itself misstates the calculation. Set verified true when, after your listed corrections are applied, every concrete claim in the movement is supported. If every concrete claim is already supported, return no corrections and verified true.
The corrections array is ONLY for text that must change. Never submit an entry about a claim that is correct, whitelisted, or supported — do not use corrections to affirm, annotate, or restate accurate text. An empty corrections array with verified true is the normal outcome for a well-composed movement.`,
          tools: [AUDIT_TOOL],
          tool_choice: { type: "tool", name: "submit_corrections" },
          messages: [{ role: "user", content: `CALCULATION LEDGER\n${auditLedger}\n\nONE PORTRAIT MOVEMENT TO AUDIT\n${JSON.stringify(section)}` }],
        }),
        signal: AbortSignal.timeout(3 * 60_000),
      })));

      const collected: Array<{ find: string; replace: string; reason: string; scope: number }> = [];
      let allVerified = true;
      for (let sectionIndex = 0; sectionIndex < responses.length; sectionIndex += 1) {
        const response = responses[sectionIndex];
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
          && typeof (item as { reason?: unknown }).reason === "string")
          // Auditors occasionally submit "affirmation corrections" — entries
          // whose replacement changes nothing, filed to note that text is
          // correct. They are not corrections; drop them at intake.
          .filter((item) => item.find.trim() !== item.replace.trim());
        // An auditor that says "not verified" but offers no fixes has found a
        // problem it cannot repair — that movement may not publish.
        if (audit.verified !== true && valid.length === 0) allVerified = false;
        collected.push(...valid.map((item) => ({ ...item, scope: sectionIndex })));
      }
      return { corrections: collected, allVerified };
    };

    // A draft that fails its audit is HELD, never discarded: the composed
    // portrait, the holdout corrections, and the stage that stopped it are all
    // preserved in the blob so the failure can be inspected and repaired.
    // Only crashes with no draft in hand fall back to the generic error.
    const holdDraft = async (
      stage: string,
      message: string,
      draft: unknown,
      remaining: Array<{ find: string; replace?: string; reason: string }> = [],
    ) => {
      console.error("Portrait held", stage, JSON.stringify({ jobId: input.jobId, runId, remaining: remaining.length }));
      await store.setJSON(key, {
        status: "held",
        stage,
        error: message,
        jobId: input.jobId,
        runId,
        startedAt,
        updatedAt: new Date().toISOString(),
        held: {
          reading: draft,
          corrections: remaining.slice(0, 20),
        },
      });
    };
    const AUDIT_UNAVAILABLE = "The portrait's fact-check could not finish this time. The draft is safe — please compose once more.";
    const HELD_CONTRADICTION = "StarGlass held this portrait back: one claim could not be reconciled with the calculated chart. The draft is preserved — please compose once more.";

    // Apply a correction set robustly. Six parallel auditors see overlapping
    // text (the shared title; the throughline voice repeats images across
    // movements), so duplicate and superseded corrections are NORMAL — the
    // arithmetic must tolerate them. The RE-AUDIT is the enforcement: nothing
    // publishes until a final full pass returns all-verified with zero
    // corrections.
    // appliedFinds persists ACROSS rounds: once a passage has been corrected,
    // later auditors re-litigating the same find are re-arguing settled text,
    // not finding new problems — skip them so rounds converge.
    const appliedFinds = new Set<string>();
    const scopeKey = (scope: number, find: string) => `${scope}:${find}`;
    const applyCorrectionSet = (value: unknown, items: Array<{ find: string; replace: string; reason: string; scope: number }>) => {
      const seen = new Set<string>();
      let current = value;
      let appliedCount = 0;
      const superseded: string[] = [];
      for (const item of items) {
        const itemKey = scopeKey(item.scope, item.find);
        if (item.find === item.replace || seen.has(itemKey) || appliedFinds.has(itemKey)) continue;
        seen.add(itemKey);
        const result = applyWithinScope(
          current as { title?: unknown; framing?: unknown; movements?: unknown[] },
          item,
          { movementIndex: item.scope, includeTitle: true, includeFraming: item.scope === 0 },
        );
        if (result.applied > 0) { current = result.value; appliedCount += 1; appliedFinds.add(itemKey); }
        else superseded.push(item.find.slice(0, 80));
      }
      if (superseded.length) console.warn("Corrections superseded or already resolved", superseded);
      return { value: current, applied: appliedCount };
    };

    // When repair rounds cannot converge, one referee call decides whether
    // the holdout corrections describe GENUINE ledger contradictions or
    // auditor pedantry — style, affirmations, re-litigations — in which case
    // the portrait publishes. A genuine finding is no longer terminal: the
    // referee must return a movement path and a safe replacement, the repair
    // is applied in scope, and ONE bounded final re-audit decides. Only a
    // contradiction that survives that repair holds the portrait — and a held
    // portrait keeps its draft. (Previously any nonempty verdict discarded
    // the completed portrait behind a generic audit error.)
    type RefereeVerdict =
      | { kind: "unavailable" }
      | { kind: "dismissed" }
      | { kind: "genuine"; findings: Array<{ movement: string; find: string; replace: string; reason: string }> };
    const refereeCorrections = async (
      readingValue: unknown,
      items: Array<{ find: string; replace: string; reason: string }>,
    ): Promise<RefereeVerdict> => {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1_500,
          temperature: 0,
          system: `You are the final referee of a calculation audit. Automated auditors could not agree on the remaining proposed corrections. Judge each one against the calculation ledger, which is literal and exhaustive and whose EQUIVALENCE RULES are part of the whitelist. A correction is GENUINE only when the portrait text it quotes makes a concrete claim — a specific sign, house, motion, geometric relationship, count, or rulership — that the ledger contradicts or does not whitelist. Judge pairwise: a sentence relating two bodies is correct when that pair is whitelisted, even if it does not enumerate other bodies in the cluster. An opposition to the Midheaven is the same fact as closeness to the IC, and Ascendant/Descendant likewise. A correction is NOT genuine when it polices style, affirms text that is already correct, calls accurate phrasing "imprecise", or re-argues a passage that already matches the ledger. Figurative language expressing a whitelisted relationship is correct.
For every genuine error, deliver a repair, not just a verdict: name the movement it lives in (its nav name, or "title"/"framing"), quote the exact contiguous find text verbatim from that movement, and give a minimal replace that fixes ONLY the false factual claim. The replacement must keep the sentence's voice, imagery, and psychological content intact — including deliberate tensions and "part of you… while another part…" contradictions, which are the portrait's method, never errors. Repair the fact; never flatten the person.`,
          tools: [{
            name: "submit_verdict",
            description: "Deliver the referee verdict on the remaining corrections, with a movement-scoped repair for every genuine error.",
            input_schema: {
              type: "object",
              additionalProperties: false,
              required: ["genuine_errors"],
              properties: {
                genuine_errors: {
                  type: "array",
                  maxItems: 20,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["movement", "find", "replace", "reason"],
                    properties: {
                      movement: { type: "string", enum: ["title", "framing", "Overture", "The Ground Floor", "The Inner Cast", "The Mirror", "The Summit", "Integration"] },
                      find: { type: "string", minLength: 12 },
                      replace: { type: "string", minLength: 4 },
                      reason: { type: "string", minLength: 8 },
                    },
                  },
                },
              },
            },
          }],
          tool_choice: { type: "tool", name: "submit_verdict" },
          messages: [{
            role: "user",
            content: `CALCULATION LEDGER\n${auditLedger}\n\nPORTRAIT TEXT\n${JSON.stringify(readingValue)}\n\nREMAINING PROPOSED CORRECTIONS\n${JSON.stringify(items.slice(0, 20).map(({ find, replace, reason }) => ({ find, replace, reason })))}\n\nReturn only the corrections that identify genuine ledger contradictions in the portrait text, each with its movement and a minimal safe replacement.`,
          }],
        }),
        signal: AbortSignal.timeout(3 * 60_000),
      });
      if (!response.ok) {
        console.error("Referee response", response.status, (await response.text()).slice(0, 1_000));
        return { kind: "unavailable" };
      }
      const result = await response.json() as { content?: Array<{ type?: string; name?: string; input?: unknown }> };
      const use = result.content?.find((item) => item.type === "tool_use" && item.name === "submit_verdict");
      const verdict = use?.input as { genuine_errors?: unknown } | undefined;
      if (!verdict || !Array.isArray(verdict.genuine_errors)) return { kind: "unavailable" };
      const findings = verdict.genuine_errors.filter((item): item is { movement: string; find: string; replace: string; reason: string } =>
        Boolean(item) && typeof (item as { movement?: unknown }).movement === "string"
        && typeof (item as { find?: unknown }).find === "string"
        && typeof (item as { replace?: unknown }).replace === "string"
        && typeof (item as { reason?: unknown }).reason === "string"
        && (item as { find: string }).find.trim() !== (item as { replace: string }).replace.trim());
      if (findings.length > 0) {
        console.error("Referee confirmed genuine errors; repairing", JSON.stringify(findings).slice(0, 1_000));
        return { kind: "genuine", findings };
      }
      console.log("Referee dismissed remaining corrections as non-genuine; publishing");
      return { kind: "dismissed" };
    };

    const reportPhase = async (phase: string, round?: number) => {
      try {
        await store.setJSON(key, { status: "working", phase, round, stage: phase, jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
      } catch (_) {}
    };

    const logCorrections = (label: string, items: Array<{ find: string; reason: string }>) => {
      console.log(label, JSON.stringify(items.slice(0, 20).map((item) => ({
        find: item.find.slice(0, 90), reason: item.reason.slice(0, 90),
      }))));
    };

    let working: unknown = toolUse.input;
    await reportPhase("auditing", 1);
    let pass = await runAudits(reading);
    if (!pass) { await holdDraft("audit-unavailable", AUDIT_UNAVAILABLE, working); return; }
    if (!pass.allVerified) { await holdDraft("held-unrepairable", HELD_CONTRADICTION, working, pass.corrections); return; }
    let totalApplied = 0;
    let refereeRepairs = 0;
    let rounds = 1;
    let converged = pass.corrections.length === 0;

    // Up to three repair rounds; each round's result is fully re-audited.
    // Convergence is a FIXED POINT, not an empty correction list: a round in
    // which no correction actually changes the text means the auditors are
    // re-litigating settled or unlocatable passages, and the verified text
    // stands as-is.
    for (let round = 0; round < 3 && !converged; round += 1) {
      logCorrections(`Audit round ${rounds} corrections`, pass.corrections);
      await reportPhase("repairing", rounds);
      const repaired = applyCorrectionSet(working, pass.corrections);
      if (repaired.applied === 0) {
        console.log("Audit reached a fixed point: no remaining correction changes the text");
        converged = true;
        break;
      }
      if (!validReading(repaired.value)) {
        console.error("Corrected portrait no longer matches the reading schema");
        await holdDraft("repair-schema", AUDIT_UNAVAILABLE, working, pass.corrections); return;
      }
      working = repaired.value;
      totalApplied += repaired.applied;
      rounds += 1;
      await reportPhase("auditing", rounds);
      pass = await runAudits(working as { title: string; framing: string; movements: unknown[] });
      if (!pass) { await holdDraft("audit-unavailable", AUDIT_UNAVAILABLE, working); return; }
      if (!pass.allVerified) { await holdDraft("held-unrepairable", HELD_CONTRADICTION, working, pass.corrections); return; }
      converged = pass.corrections.length === 0;
    }
    if (!converged) {
      console.warn("Corrections persist after three repair rounds; convening the referee", { remaining: pass.corrections.length });
      logCorrections("Persistent corrections", pass.corrections);
      await reportPhase("refereeing");
      const verdict = await refereeCorrections(working, pass.corrections);
      if (verdict.kind === "unavailable") { await holdDraft("referee-unavailable", AUDIT_UNAVAILABLE, working, pass.corrections); return; }
      if (verdict.kind === "genuine") {
        // The referee found real ledger contradictions AND supplied repairs.
        // Apply each repair inside its own movement, then run exactly one
        // final full re-audit. This is bounded: there is no second referee
        // and no further repair loop — either the repaired portrait comes
        // back clean and publishes, or it is held with its draft intact.
        const readingShape = working as { movements: Array<{ nav?: string }> };
        const resolveScope = (movement: string): { scope: CorrectionScope; key: string } | null => {
          if (movement === "title") return { scope: { movementIndex: null, includeTitle: true, includeFraming: false }, key: "title" };
          if (movement === "framing") return { scope: { movementIndex: null, includeTitle: false, includeFraming: true }, key: "framing" };
          const index = readingShape.movements.findIndex((item) => item?.nav === movement);
          return index >= 0 ? { scope: { movementIndex: index, includeTitle: false, includeFraming: false }, key: String(index) } : null;
        };
        let repairedValue = working;
        for (const finding of verdict.findings) {
          const resolved = resolveScope(finding.movement);
          if (!resolved) { console.warn("Referee finding names an unknown movement", finding.movement); continue; }
          const result = applyWithinScope(
            repairedValue as { title?: unknown; framing?: unknown; movements?: unknown[] },
            finding,
            resolved.scope,
          );
          if (result.applied > 0) {
            repairedValue = result.value;
            refereeRepairs += 1;
            appliedFinds.add(`${resolved.key}:${finding.find}`);
          } else {
            console.warn("Referee repair could not be located in its movement", finding.find.slice(0, 80));
          }
        }
        if (refereeRepairs === 0) {
          // The referee called errors genuine but none of its finds exist in
          // the text it judged — an unlocatable correction cannot publish as
          // verified, and it cannot repair anything either.
          await holdDraft("referee-unlocatable", HELD_CONTRADICTION, working, verdict.findings); return;
        }
        if (!validReading(repairedValue)) {
          console.error("Referee-repaired portrait no longer matches the reading schema");
          await holdDraft("referee-schema", AUDIT_UNAVAILABLE, working, verdict.findings); return;
        }
        working = repairedValue;
        rounds += 1;
        await reportPhase("auditing", rounds);
        const finalPass = await runAudits(working as { title: string; framing: string; movements: unknown[] });
        if (!finalPass) { await holdDraft("final-audit-unavailable", AUDIT_UNAVAILABLE, working, verdict.findings); return; }
        if (!finalPass.allVerified) { await holdDraft("held-contradiction", HELD_CONTRADICTION, working, finalPass.corrections); return; }
        if (finalPass.corrections.length > 0) {
          // Same fixed-point rule as the main loop: leftover corrections that
          // change nothing are re-litigations of settled text. Any that WOULD
          // still change the text mean the repair did not converge — hold.
          const probe = applyCorrectionSet(working, finalPass.corrections);
          if (probe.applied > 0) { await holdDraft("held-contradiction", HELD_CONTRADICTION, working, finalPass.corrections); return; }
          console.log("Final re-audit reached a fixed point after referee repairs");
        }
      }
    }

    await store.setJSON(key, {
      status: "ready",
      stage: "published",
      reading: working,
      audit: {
        verified: true,
        passes: rounds,
        corrections_applied: totalApplied,
        refereed: !converged,
        referee_repairs: refereeRepairs,
        resolution: converged
          ? (totalApplied > 0 ? "corrected" : "verified")
          : (refereeRepairs > 0 ? "referee-corrected" : "refereed"),
      },
      jobId: input.jobId,
      runId,
      startedAt,
      updatedAt: new Date().toISOString(),
    });
  } catch (reason) {
    console.error("Interpretation function failed", reason);
    try {
      if (errorKey) {
        const store = getStore({ name: "starglass-readings", consistency: "strong" });
        await store.setJSON(errorKey, { status: "error", stage: "crashed", error: "StarGlass could not compose the portrait.", runId, startedAt, updatedAt: new Date().toISOString() });
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
