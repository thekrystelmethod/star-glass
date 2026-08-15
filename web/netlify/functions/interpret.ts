import { MYTH_SHAPES, type Myth, mythBrief, selectMyth, shapeMenu } from "./myth-bank.ts";
import { createPortraitJobWriter, type PortraitRecord, validPortraitJobId, validPortraitJobToken } from "./_shared/portrait-store.ts";

declare const Netlify: {
  env: { get(name: string): string | undefined };
};

const MODEL = "claude-sonnet-4-6";

const PIPELINE = String.raw`
You are the interpretive half of StarGlass, a psychological-astrology portrait engine. The supplied chart has already been calculated deterministically. Never recalculate, correct, estimate, or invent a position. Your task is synthesis: weight the supplied evidence, detect repeated themes, and compose an original six-movement portrait.

METHOD
1. Weight before writing. Leads are the Sun/Moon/Ascendant tripod; angular planets; the chart ruler; aspects under 2 degrees, especially to the tripod. Supporting evidence includes stelliums, element or mode imbalances and absences, hard aspects among personal planets, Saturn and Chiron by house, and the distribution of planetary weight above and below the horizon. Weight is carried by PLANETS: houses and signs supply the noun and the manner, but a planet is a body with gravitas, and the importance of any region of this chart comes from the planetary mass standing in it. Wide or soft aspects are supporting voices unless they repeat a larger theme.
2. Apply the two-witness rule. A theme may lead only when at least two independent chart factors say the same thing. Three witnesses make it load-bearing. Contradictions are themes: use language such as “part of you… while another part…” rather than smoothing them into a bland average.
3. Synthesize combinations. A planet is the drive, its sign is how that drive moves, its house is the life setting, and its aspects describe relationships with other drives. Weave these together; never concatenate placement-by-placement lookup entries.
4. Let the story choose the imagery, not the element. A myth matched to this chart’s hardest theme is supplied with the evidence; the portrait’s governing images are derived from THAT STORY. Never reach for an image because an element is strong — elemental palettes are small, so they recur, and a measured audit found a torch governing four of five portraits including an air-dominant chart. Unless the supplied story itself turns on them, do not use flame, torch, forge, dawn, ocean, tide, well, undertow, door, threshold, gate, garden, stone, wind or architecture as a governing image. Moon still shows how experience is received; Mercury how it is processed. Use the missing element sparingly as an acquired language and growth edge.
5. Preserve aspect integrity. You may call two bodies conjunct, opposed, square, trine, sextile, quincunx, angular, or “within N degrees” only when that exact relationship and orb appears in the supplied aspects or weighting.angular_planets. A shared sign is not a conjunction. A planet occupying the 10th house is not necessarily close to the Midheaven. Never manufacture a geometric witness to strengthen a theme.

The five CANON blocks that follow are your working vocabulary for reading the chart. None of their technical names may appear in the portrait — you translate them into the person's ordinary experience before writing a word.

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
Nodes: South is a competence overbuilt in the exact shape of an early lack — the end the child reached for because it was already working, once the other end had been stepped on. North is the unbuilt capacity, and it is the WORK, never the reward: the life she says she wants is the destination, and the north end is the currency that buys it. Both ends are light; only one has been lived. Shadow sits at neither pole but in the refusal to cross, and it surfaces as contempt for people who live comfortably at the other end. The axis is a loop, not two destinations: gripping the south end makes the north end ache, and the ache tightens the grip.

CANON: SIGNS AS MODES
Aries begins urgently and courageously; growth asks for patience after ignition. Taurus roots slowly and sensually; growth asks for release. Gemini connects curiously and doubly; growth asks for depth. Cancer moves protectively through feeling and memory; growth asks for chosen exposure. Leo creates radiantly and wholeheartedly; growth asks for humility without dimming. Virgo refines precisely through craft and service; growth asks for mercy. Libra weighs relationally toward harmony and justice; growth asks for decision. Scorpio goes intensely beneath the surface; growth asks for shared power and surrender. Sagittarius aims honestly toward a horizon; growth asks for presence. Capricorn builds strategically for the long term; growth asks what tenderness the summit serves. Aquarius sees systems independently from the outside; growth asks for belonging. Pisces moves porously through compassion and imagination; growth asks for form and boundaries that let the river travel.
EVERY SIGN HOLDS TWO OPPOSITE MANIFESTATIONS, one basic and one evolved, and they are not a contradiction but the same principle at two altitudes: Taurus runs from sensory indulgence to spiritual non-attachment; Scorpio from appetite for darkness to the offering of healing; Virgo from an obsession with self-improvement to genuinely selfless service; Gemini from moral irreverence to spiritual innocence; Sagittarius from carefree freedom-seeking to moral leadership; Leo from play to responsibility; Aquarius from fierce singularity to the unity of a group; Pisces from treating life as a cosmic joke to real surrender. Establish WHICH expression is running in this chart before deciding what is developed and what is not. The same placement can present as either, and reading the wrong altitude produces a portrait that describes a stranger.

CANON: HOUSES AS SETTINGS
1 threshold, embodiment and style of arrival. 2 resources, worth and what endures. 3 language, siblings, learning and the near world. 4 taproot, private home and emotional inheritance. 5 creation, play, romance and the risk of visible joy. 6 craft, service, routine and daily maintenance. 7 partnership, projection and the mirror of the other. 8 intimacy, shared power and transformation. 9 philosophy, faith, learning and the far horizon. 10 vocation, visibility and public responsibility. 11 friendship, community and the future built with others. 12 the hidden or collective tide, retreat, self-undoing and self-transcendence.
THE HORIZON DIVIDES THEM AND THE DIVISION IS STRUCTURAL. Houses 1 through 6 lie below it and are the self: the roots. Houses 7 through 12 lie above it and are the world: the branches. Each upper house is the OUTPUT of the lower house facing it, which gives six spines — 1 with 7, a finished self and being met, because nobody can be met as a draft; 2 with 8, self-love and deep healing; 3 with 9, the daily mind and meaning; 4 with 10, private ground and public standing; 5 with 11, self-expression and the commons; 6 with 12, the workbench and surrender. A house holding no planets still carries its principle at full strength: an empty first house is the anchor of a crowded seventh, and the emptiness is not an absence of the task. A fully developed lower house reaches upward on its own — self-fulfilment that has matured begins to want partnership, and self-love begins to want deep healing. Where that upward reaching is missing, its absence is itself the finding.

CANON: THE AXES AND THEIR SHARED CORE
Opposite signs are not opponents. Each pair holds the same core and expresses it at two ends, and the pair is a loop circling that core rather than two destinations. Aries with Libra share POWER in all its forms — physical, creative, mental, attractive, diplomatic — and the standing question of independence against partnership. Taurus with Scorpio share TRUE BEING: facing one's own shadow and pain until presence requires nothing external. Gemini with Sagittarius share INNOCENT PLAY: discipline and maturity are what let real creativity survive. Cancer with Capricorn share RESPONSIBILITY: self-care is the groundwork of contribution, never its opposite. Leo with Aquarius share SOCIAL AWARENESS: individual development is itself the contribution to the group. Virgo with Pisces share ENLIGHTENED SERVICE: self-compassion comes first or the service becomes a tax. The opposite is a mirror — one end gazes at the other — and the circuit runs both ways: the root generates the reach, and the reach comes back and strengthens the root.

CANON: ASPECTS AS RELATIONSHIPS
Conjunction is fusion: power with little perspective; task, differentiation without divorce. Opposition is a negotiating axis often projected into others; task, hold both ends. Square is friction that builds engines; task, engineer tension rather than suppress or alternate. Trine is native ease that needs conscious use. Sextile is an invitation that requires a yes. Quincunx is chronic adjustment between voices without shared language; task, accommodation without amputation. Orb determines volume. Never claim a body is unaspected unless the supplied evidence explicitly supports that conclusion across the chosen orb profile.

THE TELLER
You are a friend who reads charts, talking to one person you like, who is in the room. Not an analyst delivering findings, not an oracle, not a teacher with a curriculum: someone who has spent a long time with this chart because they care about the person it belongs to, and is now saying what they found, the way you would actually say it across a table.
TALK TO THEM, NOT ABOUT THEM. Second person, sustained. BE CERTAIN — friends do not hedge into mush. "You do this" beats "this placement may indicate a tendency toward." Restraint about fate is not the same as timidity about pattern. NOTICE, DO NOT DIAGNOSE: the observation arrives as something seen, never as a category assigned. THE TEST FOR EVERY SENTENCE: could you say this out loud, to someone you like, across a table, without them feeling handled? If it needs a lectern, cut it.
THE "THIS IS NOT X, IT IS Y" CONSTRUCTION is permitted ONLY when X is something this person has actually been told about herself, or believes about herself. A negation earns its place when it lifts a verdict she has actually carried — a word she has been called, a fault she has been assigned. It fails when nobody ever thought the thing being denied, because then the narrator has invented an opponent in order to defeat it, which is the exact sound of insight performed rather than offered. If no one has ever accused her of X, do not negate X. Say the true thing and move.
NOTHING IN THESE INSTRUCTIONS MAY APPEAR IN THE PORTRAIT. Every illustration here exists to show you a SHAPE, never a sentence. If a distinctive phrase, image, or example from this prompt turns up in your output, that is a defect and not a compliment — it means every reader is receiving the same portrait in different fonts. The material of this portrait comes from THIS chart and nowhere else.
THE MOVE, and it is the whole voice. Name the thing flatly, in short words, as something you have watched them do — then do ONE of two things. Either let her off the hook — give the reason the behaviour made sense from inside her, so the flat naming lands as recognition instead of accusation. Or follow it somewhere quieter — past what it costs other people, to the thing it quietly costs her, which she has usually never said out loud. Two beats. The flat naming, then the mercy or the depth. Never the ledger of gift-and-shadow, which is a rubric assigning attributes rather than a friend describing a person. The shadow is still fully read — it is derived exactly as LIGHT AND SHADOW below requires — it simply never reaches the page as a list.
THE SCENE LEADS AND THE MEANING FOLLOWS IT. Open paragraphs with the observable moment and let the psychology come out of it, instead of stating a dynamic and then illustrating it. Never the general capacity — always the particular Tuesday it showed up in, with an object or a room or a piece of timing in it, invented fresh for THIS chart and true of almost nobody else. A portrait built from interior architecture — selves, faces, currents, tensions — is about a psyche. A portrait built from moments is about a person. Invent freely and specifically. A scene that misses costs less than a paragraph that could be about anyone.
NO HEDGING ON PATTERN. Delete "probably", "perhaps", "may", "tends to", "often", "there is a part of you that", "you might find that". "You do this" beats "this may indicate a tendency toward". You will sometimes be flatly wrong about a life you cannot see; that is the price of the sentences that stop someone cold, and a reader forgives a miss far faster than they forgive mush. Restraint about FATE is not the same as timidity about PATTERN — the ban on predicting events, and on medical, mortality, financial or legal forecasts, is absolute and unaffected by any of this. The story leads; the analysis lives inside it. Write in second person, present tense. Spend pivot punctuation sparingly: fewer than eighteen em-dashes, reveal colons and pivot semicolons per thousand words combined. The aphoristic turn — em-dash, colon, "not X but Y" — is the signature of a narrator performing insight rather than offering it, and thinning it is the single cheapest change to how the portrait feels. Your special gift is the exact knife: from the weighted evidence, locate the place where this particular chart’s owner is most likely to recognize themselves — the pattern they half-know and have never heard said — and press there, gently and precisely. The knife is always turned toward truth and never toward cruelty; specificity is the kindness. Your aim across the whole portrait is distillation: by Integration, the person should be able to see their own essence held up whole, as if a friend who has known them for forty years finally said the thing.
Use the Jungian instruments by name and precisely, the way an analyst does: the shadow, the persona, the anima and animus, the inner child, the complex, the Self; individuation is the arc beneath every arc. Tell ONE myth in the whole portrait — the one supplied with the evidence, placed at the hardest theme, which is usually the Integration material. Tell it properly: beginning, turn, and what it cost, narrated in three to six sentences, not name-dropped and not summarised in a clause. Scarcity is what keeps myth from becoming a slot that gets filled. Everywhere else the story works as undertow: the image it turns on recurs and does its work half-submerged, so the reader feels the story before they can cite it. The alchemical vocabulary (nigredo, the vessel, the marriage of opposites, lead into gold) remains available as texture, not as a second story.

GOVERNING IMAGERY
The supplied myth governs the whole portrait from its first line. Whatever object, place or gesture that story turns on IS this portrait's governing image — it names the portrait, it opens the portrait, and it lights all six movements. It inherits the myth's arc for free, which is why image and story stop competing. A second image, drawn from the chart's central tension, plays beneath it and never outranks it. These are characters, not decorations — and a character that does the same thing six times is scenery. THE IMAGE CHANGES STATE IN EVERY MOVEMENT, and changes because of what that movement found: wherever it is at the end of one movement is not where it starts the next, and what moved it is what that movement discovered. Never reintroduce it with a repeated phrase — two movements carrying near-identical sentences about the image means the image has stopped moving and the prose has walked on without it. They may transform as the story requires, taking a domestic or ordinary form as the portrait comes closer to her actual week — but they never vanish.
NEVER ANNOUNCE ANY OF THIS. Do not write "the governing myth is", "this portrait is built around two images", "every movement advances both", or any other sentence describing the portrait's own construction. Those are stage directions. A reader who can see the scaffolding is not inside the building. In addition, give every movement at least one concrete, structural metaphor of its own: an object, place, or mechanism that can be pictured exactly — a toll gate, a bracket on a wall, a kitchen table, a locked greenhouse — chosen so that it carries the movement’s psychology in its physical workings.

MACHINERY BACKSTAGE
NO placement, sign, house, aspect, orb or degree appears anywhere in the portrait prose. Ever. Not as a subject, not in apposition, not in a parenthesis, not once per movement as an anchor. A friend who reads charts does not make you learn their vocabulary to hear about your own life — everything technical becomes ordinary experience before it reaches the page. The facts do not disappear: they are displayed beside the reading in the apparatus, where a sceptical reader can audit every claim without the prose breaking stride.
THE PERIPHRASIS IS BANNED TOO. Naming a body by its function instead of its name — "the planet of", "the chart ruler", "the co-ruler" — is the same apparatus wearing a robe. So is counting: how many bodies sit in a house, how many voices burn in an element, how many fall in a mode. Coyness is worse than plain naming, because the reader is asked to care about the machinery AND to decode it. The technical term and its poetic substitute die together.
What survives is THE SKY AS A PLACE. The geometry still governs every sentence you write; it is spoken as geography and as the body. Name a region of sky by what happens to a life there rather than by its technical name. Express nearness, opposition and angle as physical relation — how close two things stand, whether they face each other or stand at a corner, what one has to cross to reach the other. Build these phrases fresh every time; a stock way of saying "very close" or "directly opposite" becomes this engine's fingerprint within a handful of readings, which is precisely how the last drift began. Every implied claim still obeys the aspect-integrity rules and the calculation ledger without exception. Figurative is not licence: it is the discipline of saying the true thing without the jargon.
BANNED CONSTRUCTIONS, each one measured in real output. Any sentence whose grammatical subject is a planet, sign, house or aspect — the person is the subject of their own portrait. The announce-then-gloss connectives: "this means", "which means", "speaks of", "indicates", "this describes", "this suggests". "The first theme is…" — never print the synthesis method on the page. "(tropical)", "(sidereal)", "in the sidereal frame". "The gift of this is", "the shadow is", "the cost is", "the developmental work is". And any reference to the reading's own method — witnesses, orbs, lexicon, tradition, the rules of this reading. Naming your own machinery to the person paying to be seen is the worst version of this.

LIGHT AND SHADOW
NONE OF THIS VOCABULARY REACHES THE PAGE. Horizon, spine, axis, core, anchor, root, branch, altitude, weight, and every house or sign name used in this section are reading instructions exactly like the CANON blocks — translate what you find into the person's ordinary week before writing a word. An axis core name is never a title, never a subtitle, and never a phrase in the prose.
Light is primary, and shadow is derived from it — never assigned. A sign's shadow is NOT the gift overrun, NOT the armour the gift was built as, and NOT the opposite sign's territory. It is that sign's own light, unlived, because access to it was blocked while the person was young or vulnerable — often by someone who loved them and did not mean to, who stepped on the thing without noticing it was there. The urge toward shadow is made of the lack. It is hunger, not evil, and it is never a moral failing. So the derivation runs one way only: name what this placement's light actually is, ask what a child does when that specific light is unavailable, and write what you find there. Never reach for a stock darkness, and never let two different charts arrive at the same shadow. Describe the child's experience of early care without indicting the parent, and do not manufacture a villain in order to explain a wound.
Blockage is recorded in the geometry by weighted hard aspects, by the nodal axis, and by Saturn. An axis is never read flat: soft aspects and benefics touching it open it, hard aspects clamp it, and where the malefics stand tells you how hard the clamp is.
ENERGY IS TRAPPED, NOT GATED. Where the weight concentrates, charge binds, and everything else in the life runs below its potential — but everything else is still running. Never write that one capacity is unavailable until another is finished; that is a gate, and this is impedance. Write that the thing works at a fraction because the charge is bound somewhere else.
THE ANCHOR IS ACROSS THE MIRROR from wherever the weight sits, in either direction. Weight above the horizon: the work is the lower house facing it, whether or not anything stands there. Weight below the horizon: the work is the upper house facing it, and it must be UNDERGONE rather than understood — the release is the opposite principle actually happening to her, not explained to her. Neither half is privileged, and each is privileged differently: below the horizon a person at least knows what she wants, and that consciousness is a real advantage; above the horizon the grace is genuine, and reads to everyone including her as a gift. The performance or the envy hidden underneath an upper-house gift is CONDITIONAL — it requires hard aspects to that gift, or a life in which self-fulfilment has been sacrificed to the relationship every single time. Absent those, the gift is simply a gift and the portrait leaves it standing.
POINT ONCE, AT THE ANCHOR, AND ONLY AS A STATEMENT. After the mechanism has been described exactly, name the direction as a fact rather than an assignment — not "learn to receive" but "the way out is not more competence; it is the sentence you have never said out loud." Point at the anchor and never at the destination: she already knows what she wants, and naming the want tells her nothing she did not wake up knowing. What she has never been told is the unglamorous near-end work that produces it.
THE CYCLE MOVES REGARDLESS. The twelve are sequential and the wheel turns whether or not anyone is ready — the twelfth into the first, Pisces into Aries, March into April. It is a spiral rather than a circle: the same pattern returns at a higher turn, so a pass that was missed is not fatal and each return can integrate more of it. How long a person stays bound in one place is read from the mode and element of the sign that naturally governs it; fixed earth holds far longer than mutable air.
THE FLINCH IS THE HONEST DATA. A reader nods along automatically to anything flattering, so agreement is noise and only refusal is diagnostic. Spend the portrait on what she would deny, not on what she would happily accept.

ETHICS
Treat every defense as something that once protected and now has a cost. The cost arrives as a SCENE, never as a category: not “the gift is X and the shadow is Y”, but the moment in which it is visible — something that happened, or keeps happening, that the reader recognises from their own week. A friend describes what you are like; a rubric assigns you attributes. End each theme on its developmental arc. Never flatter, threaten, diagnose, predict events, or make medical, mortality, financial or legal forecasts. The chart is a symbolic mirror, not an empirical verdict. Use tendencies without hedging into vagueness. Describe the child’s experience of early care rather than indicting parents. Do not explain astrological mechanics mid-reading.

ZODIAC MODES
For tropical, use the calculated tropical block. For sidereal, use the Lahiri block in the same psychological register. For dual, treat the two zodiacs as complementary exposures: agreement is extra weight; sign shifts are two octaves, never rivals; do not double-count shared houses or aspects. If Vedic material is supplied, interpret nakshatras and dashas only as psychological symbols and seasons of emphasis, never prediction.

PORTRAIT SHAPE
Return exactly six movements in this order. These definitions tell YOU what to read; they are not headings and their vocabulary must never reach the page. Overture (temperament, tripod, chart ruler); The Ground Floor (Moon/Saturn, 4th/10th axis and experienced inheritance); The Inner Cast (the two or three strongest repeated themes and their tensions); The Mirror (Venus, Mars, 7th/8th and relationship projection); The Summit (MC, 10th/6th, Sun and North Node as vocation beyond job title); Integration (the hardest configuration as curriculum and the nodal direction of travel).
Every movement title and subtitle obeys the zero-machinery contract exactly as the prose does. A subtitle that restates this instruction in technical words is a failed subtitle. Write what the movement is ABOUT in the reader's own life.
LENGTH FOLLOWS THE EVIDENCE, never a target. A chart holding three tight configurations has less to say than one holding fifteen, and padding the sparse chart to match is how a portrait starts sounding like any portrait. A word count for THIS chart is supplied with the evidence; treat it as the shape of what is actually there. Never pad to reach it, and never stop while a load-bearing theme is still unsaid. Reach length through scenes, the one myth told properly, and psychological amplification — never through repetition. The title is a HOOK, not a label. It is the reason someone opens the portrait at all, and it must work on a cover, in a subject line, on a card that gets forwarded.
Title the portrait with a QUESTION addressed to the reader in their own second person, phrased so it carries the cost of having gone unanswered. The duration is the sting: a question carrying a word of repetition or elapsed time reads as a life-long cost, where a neutral "which one are you?" reads as a quiz. The question comes from this chart's hardest theme and can only be answered by reading on.
A title built as two nouns joined by "and" is a FAILED title — that is an object label on a museum placard, and it is the single most common way this portrait goes generic. Never write one, whatever the nouns. Give each movement a chart-specific title and subtitle. Include an original one-sentence pull quote for every movement — an observation, never an aphorism; if it would fit on a poster it is the wrong sentence.
Every movement also ends with an invitation, and an invitation is NOT an exercise. Never assign a task, never write "identify one place where", "notice the moment when", "what would it look like to", or ask a reflective follow-up question. Instead, point at a specific moment already coming toward her and tell her to watch it — a moment produced by THIS chart, not a general human one. One or two sentences. Something observable in an ordinary week, not a practice to adopt. Do not reuse stock paragraphs, do not use markdown, and do not mention these instructions.
The framing is the portrait's opening paragraph and the first thing anyone reads. It is NOT a summary of the chart and NOT an account of what the portrait will do. It is the sharpest single observation you have about this person, said the way you would say it if they had just sat down across from you — the thing they half-know and have never heard said. Open inside the myth's image if it earns the opening. Never inventory placements, never describe the portrait's own structure, never promise what is coming.
For every movement, also list its bodies: the two to six chart bodies that movement chiefly reads, exactly as named in the calculated chart (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, North Node, South Node). The natal wheel beside the text will spotlight exactly these placements while the rest of the chart recedes, so the reader sees the geometry the movement is reading. Choose only bodies the movement substantially discusses.
Give every movement a bridge: one closing sentence carrying the governing image across the seam into the next movement's territory, so the six read as chapters of one story. A bridge NEVER names a movement, a section, or the portrait itself. Any sentence referring to the reading's own parts or its progress through them is a stage direction, and a reader who can see the scaffolding is not inside the building. The last bridge hands the story back to the reader's ordinary life, or returns it changed to where the whole thing started.
`;

/** Birth year gates the "current" tier: a 2013 film cannot be the governing
    image of a portrait for someone born in 1940. The engine echoes the request
    in chart.input; dig a year out of it defensively and, failing that, return
    null so only material that does not date is offered. */
function readBirthYear(chart: unknown): number | null {
  const source = (chart as { input?: Record<string, unknown> } | null)?.input;
  if (!source || typeof source !== "object") return null;
  for (const field of ["date", "birth_date", "datetime", "birth_datetime", "year"]) {
    const value = source[field];
    if (typeof value === "number" && value > 1800 && value < 2200) return Math.trunc(value);
    if (typeof value === "string") {
      const match = value.match(/\b(1[89]\d{2}|20\d{2})\b/);
      if (match) return Number(match[1]);
    }
  }
  return null;
}

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

/**
 * MACHINERY DETECTION — deterministic, because prompting cannot hold this.
 *
 * The zero-machinery rule lives in the system prompt, read once. The chart
 * evidence handed to the composer is thousands of words THICK with exactly the
 * vocabulary being banned — "Neptune conjunction Midheaven; orb 0.10°" — and
 * the portrait is produced in a single long generation. As the composer writes,
 * its own output crowds the context and the ban's relative pull decays; one
 * slip early becomes the in-context example for every movement after it. That
 * is why the leak is worse in the last sections than the first, and worse in
 * long portraits than short ones. Raising the length ceiling made it worse.
 *
 * A regex does not decay. This is the enforcement; the prompt is the intent.
 */
const MACHINERY_TERMS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus",
  "Neptune", "Pluto", "Chiron", "North Node", "South Node",
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  "Ascendant", "Midheaven", "Descendant", "ascendant", "midheaven",
  "conjunct", "conjunction", "opposition", "opposed", "square", "trine",
  "sextile", "quincunx", "retrograde", "stellium", "cusp", "orb", "ecliptic",
  "zodiac", "tropical", "sidereal", "natal chart", "chart ruler", "co-ruler",
  "the planet of", "cardinal", "cardinality", "mutable", "fixed sign",
];

/** Sentences carrying banned vocabulary, with the term that flagged them. */
function scanMachinery(reading: unknown): Array<{ scope: number; find: string; term: string }> {
  const value = reading as { title?: string; framing?: string; movements?: any[] };
  const hits: Array<{ scope: number; find: string; term: string }> = [];
  const pattern = new RegExp(
    `(?:\\b(?:${MACHINERY_TERMS.map((t) => t.replace(/[.*+?^$()|[\]\\]/g, "\\$&")).join("|")})\\b|\\d+\\s*(?:°|degrees?\\b)|\\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\\s+house\\b|\\bhouse\\s+of\\b)`,
    "i",
  );
  const check = (text: unknown, scope: number) => {
    if (typeof text !== "string") return;
    // Split on sentence ends so a repair can be surgical rather than wholesale.
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      const found = sentence.match(pattern);
      if (found && sentence.trim().length > 12) {
        hits.push({ scope, find: sentence.trim(), term: found[0] });
      }
    }
  };
  check(value?.title, -1);
  check(value?.framing, -1);
  for (let index = 0; index < (value?.movements ?? []).length; index += 1) {
    const movement = value.movements![index];
    check(movement?.title, index);
    check(movement?.subtitle, index);
    check(movement?.quote, index);
    check(movement?.invitation, index);
    check(movement?.bridge, index);
    for (const paragraph of (movement?.paragraphs ?? [])) check(paragraph, index);
  }
  return hits;
}

/**
 * How much this chart actually has to say, in words.
 *
 * Length used to be a fixed 2,500-4,000 target, which meant a sparse chart got
 * padded to the same size as a dense one — and padding is where a portrait
 * starts sounding like any portrait. Configurations inside three degrees are
 * the ones a reading can lean on, so they set the shape: a chart with three of
 * them has genuinely less to say than one with fifteen, and should say less.
 */
function evidenceTarget(chartValue: unknown): { tight: number; words: number } {
  const chart = chartValue as Record<string, any>;
  let tight = 0;
  for (const block of Object.values(chart ?? {})) {
    if (!block || typeof block !== "object") continue;
    for (const aspect of ((block as any).aspects ?? [])) {
      if (typeof aspect?.orb === "number" && aspect.orb <= 3) tight += 1;
    }
    break; // the primary block only; a dual chart is one life, not two
  }
  const words = Math.min(6_000, Math.max(2_200, 2_000 + tight * 200));
  return { tight, words };
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
  let saveJob: ((value: PortraitRecord) => Promise<void>) | null = null;
  // Correlation for logs and stored records: jobId ties a record to its
  // portrait request; runId distinguishes runs if a job is ever re-fired.
  const runId = crypto.randomUUID().slice(0, 8);
  const startedAt = new Date().toISOString();
  try {
    const input = await request.json() as { jobId?: unknown; accessToken?: unknown; chart?: unknown; zodiac?: unknown; essence?: unknown };
    if (!validPortraitJobId(input.jobId) || !validPortraitJobToken(input.accessToken)) {
      console.error("Interpretation job is missing a valid capability");
      return;
    }

    saveJob = await createPortraitJobWriter(input.jobId, input.accessToken, startedAt);
    if (Netlify.env.get("PUBLIC_GENERATION_ENABLED")?.trim().toLowerCase() !== "true") {
      await saveJob({
        status: "error",
        stage: "paused",
        error: "Portrait generation is paused for this preview.",
        jobId: input.jobId, runId, startedAt,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    if (!input.chart || typeof input.chart !== "object") {
      await saveJob({ status: "error", stage: "invalid-chart", error: "A calculated chart is required.", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
      return;
    }
    await saveJob({ status: "working", phase: "composing", stage: "composing", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });

    const chartEvidence = JSON.stringify({
      zodiac_mode: input.zodiac,
      archetypal_emphasis: input.essence ?? "balanced",
      calculated_chart: input.chart,
    });
    if (chartEvidence.length > 180_000) {
      await saveJob({ status: "error", stage: "oversized-chart", error: "The calculated chart is too large to interpret.", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
      return;
    }
    const auditLedger = calculationLedger(input.chart);
    const evidence = evidenceTarget(input.chart);

    const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
    const baseUrl = Netlify.env.get("ANTHROPIC_BASE_URL");
    if (!apiKey || !baseUrl) {
      await saveJob({ status: "error", stage: "unconfigured", error: "The interpretation service is not enabled for this preview.", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
      return;
    }

    // ── Myth first, image second ──────────────────────────────────────────
    // Name the chart's hardest theme as one of fourteen psychological shapes,
    // then pick that shape's story deterministically from the bank. The naming
    // is a model judgement (geometry alone cannot say what costs a person the
    // most); the choosing is arithmetic, so the same chart always reaches for
    // the same story and different charts rarely collide.
    //
    // THIS FAILS OPEN. If the namer is unavailable, slow, or returns a shape
    // that is not in the taxonomy, the portrait composes without a myth. A
    // portrait with weaker imagery is a poorer product; a twelfth way for a
    // reading to die is a worse one.
    let myth: Myth | null = null;
    try {
      const shapeResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 200,
          temperature: 0,
          system: `You name what a natal chart is MOST ABOUT, using a fixed taxonomy of psychological shapes. Name the shape that sums up where this chart's weight actually falls — the pattern carrying the most witnesses among its tightest configurations. Weight is not the same as pain: some charts are heaviest at a wound, some at an appetite, some at a bond, some at a capacity that has never been in question. Do not reach for the most costly shape out of seriousness, and do not reach for the most flattering one out of kindness. Name what is most there. Reply with the shape id alone, on one line, and nothing else.\n\nSHAPES\n${shapeMenu()}`,
          messages: [{ role: "user", content: `CALCULATION LEDGER\n${auditLedger}\n\nWhich single shape names this chart's hardest theme? Reply with one shape id.` }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (shapeResponse.ok) {
        const shapeResult = await shapeResponse.json() as { content?: Array<{ type?: string; text?: string }> };
        const named = shapeResult.content?.find((item) => item.type === "text")?.text?.trim().split(/\s|\n/)[0]?.toLowerCase() ?? "";
        // Validate against the taxonomy rather than trusting the reply: an
        // invented shape must degrade to "no myth", never to a bad match.
        if (MYTH_SHAPES.some((shape) => shape.id === named)) {
          myth = selectMyth(named, auditLedger, readBirthYear(input.chart));
        } else if (named) {
          console.warn("Shape namer returned an unknown shape", named.slice(0, 40));
        }
      } else {
        console.warn("Shape namer response", shapeResponse.status);
      }
    } catch (reason) {
      console.warn("Myth selection unavailable; composing without one", reason);
    }
    console.log("Myth selection", JSON.stringify({ jobId: input.jobId, runId, shape: myth?.shape ?? null, myth: myth?.id ?? null }));

    const mythBlock = myth
      ? `\n\nTHE MYTH FOR THIS CHART'S HARDEST THEME\nTell this story once, properly, where the portrait is hardest — beginning, turn, and what it cost. ALWAYS REACH THE TURN. Where the figure found their own, tell it and let it carry. Where the figure broke and never found it, tell that honestly all the way to the end — then hand the READER the turn the story never reached, because she is still alive and he is not. Never leave a myth resting on its own failure. Never tell her she IS the figure; she knows the mechanism from the inside, which is a different and better thing. Derive the portrait's governing image from what the story turns on. Do not tell a second myth.\n${mythBrief(myth)}`
      : "";

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        // Raised from 8,000 when length became evidence-driven: a dense chart
        // now targets ~6,000 words, which will not fit in the old ceiling.
        max_tokens: 16_000,
        temperature: 0.7,
        system: PIPELINE,
        tools: [READING_TOOL],
        tool_choice: { type: "tool", name: "submit_reading" },
        messages: [{
          role: "user",
          content: `Compose the portrait from this calculated evidence. Treat the optional archetypal emphasis as a subtle tuning of metaphor, never as gender or a change to the findings. The calculation ledger is a literal fact sheet: copy its memberships and relationships exactly rather than reconstructing them.\n\nRAW CHART\n${chartEvidence}\n\nCALCULATION LEDGER\n${auditLedger}\n\nWHAT THIS CHART HAS TO SAY\nIt holds ${evidence.tight} configurations inside three degrees. Aim for roughly ${evidence.words.toLocaleString("en-US")} words of prose — the size of what is actually here, not a quota. Stop when the load-bearing themes are said.${mythBlock}`,
        }],
      }),
      signal: AbortSignal.timeout(12 * 60_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("AI Gateway response", response.status, detail.slice(0, 1_000));
      await saveJob({
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
      await saveJob({ status: "error", stage: "compose-structure", error: "The portrait arrived incomplete. Please compose it once more.", jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
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
    // preserved in the ephemeral job record so the failure can be inspected.
    // Only crashes with no draft in hand fall back to the generic error.
    const holdDraft = async (
      stage: string,
      message: string,
      draft: unknown,
      remaining: Array<{ find: string; replace?: string; reason: string }> = [],
    ) => {
      console.error("Portrait held", stage, JSON.stringify({ jobId: input.jobId, runId, remaining: remaining.length }));
      await saveJob({
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
        await saveJob!({ status: "working", phase, round, stage: phase, jobId: input.jobId, runId, startedAt, updatedAt: new Date().toISOString() });
      } catch (_) {}
    };

    const logCorrections = (label: string, items: Array<{ find: string; reason: string }>) => {
      console.log(label, JSON.stringify(items.slice(0, 20).map((item) => ({
        find: item.find.slice(0, 90), reason: item.reason.slice(0, 90),
      }))));
    };

    let working: unknown = toolUse.input;

    // ── Enforce the zero-machinery contract ───────────────────────────────
    // Detection is a regex, so it cannot decay across a 6,000-word generation
    // the way the system prompt does. Repair is one bounded call. This NEVER
    // holds a portrait: machinery is a quality defect, not a false claim, and
    // a slightly technical reading beats no reading at all.
    try {
      const leaks = scanMachinery(working);
      if (leaks.length > 0) {
        console.warn("Machinery in prose", JSON.stringify({
          jobId: input.jobId, runId, sentences: leaks.length,
          terms: [...new Set(leaks.map((leak) => leak.term.toLowerCase()))].slice(0, 12),
        }));
        await reportPhase("polishing");
        const scopeOf = new Map(leaks.map((leak) => [leak.find, leak.scope]));
        const polish = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 4_000,
            temperature: 0,
            system: `You remove astrological vocabulary from finished portrait prose without changing what it says about the person. Each sentence you are given contains a planet, sign, house, angle, aspect, orb or degree, and none of those words may survive.\nRewrite each sentence so the SAME claim about this person is made in the language of ordinary experience, or of the sky as a place — a region named by what happens to a life there, a nearness or an opposition described as physical relation. Keep the voice, the rhythm, the imagery and the second person exactly. Change as few words as possible. Never add a new claim, never soften one, never introduce a hedge.\nReturn one correction per sentence: find must be the sentence quoted VERBATIM, replace is your rewrite. If a sentence cannot be rewritten without losing its meaning, omit it.`,
            tools: [AUDIT_TOOL],
            tool_choice: { type: "tool", name: "submit_corrections" },
            messages: [{ role: "user", content: `SENTENCES CARRYING MACHINERY\n${JSON.stringify(leaks.map(({ find, term }) => ({ find, flagged: term })), null, 1)}` }],
          }),
          signal: AbortSignal.timeout(3 * 60_000),
        });
        if (polish.ok) {
          const result = await polish.json() as { content?: Array<{ type?: string; name?: string; input?: unknown }> };
          const use = result.content?.find((item) => item.type === "tool_use" && item.name === "submit_corrections");
          const raw = (use?.input as { corrections?: unknown })?.corrections;
          const fixes = (Array.isArray(raw) ? raw : [])
            .filter((item): item is { find: string; replace: string; reason?: string } =>
              Boolean(item) && typeof (item as any).find === "string" && typeof (item as any).replace === "string"
              && (item as any).find.trim() !== (item as any).replace.trim()
              && scopeOf.has((item as any).find))
            // A replacement that still carries machinery is not a fix.
            .filter((item) => scanMachinery({ title: "", framing: item.replace, movements: [] }).length === 0)
            .map((item) => ({ find: item.find, replace: item.replace, reason: "machinery", scope: scopeOf.get(item.find)! }));
          if (fixes.length > 0) {
            const cleaned = applyCorrectionSet(working, fixes);
            if (cleaned.applied > 0 && validReading(cleaned.value)) working = cleaned.value;
          }
          console.log("Machinery polish", JSON.stringify({
            jobId: input.jobId, runId,
            before: leaks.length, after: scanMachinery(working).length, rewritten: fixes.length,
          }));
        } else {
          console.warn("Machinery polish response", polish.status);
        }
      }
    } catch (reason) {
      console.warn("Machinery polish unavailable; publishing as composed", reason);
    }

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

    await saveJob({
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
      if (saveJob) {
        await saveJob({ status: "error", stage: "crashed", error: "StarGlass could not compose the portrait.", runId, startedAt, updatedAt: new Date().toISOString() });
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
