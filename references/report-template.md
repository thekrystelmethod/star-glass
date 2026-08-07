# The Full Report

The third output mode. Conversational answers a question; a portrait tells the
story; a **report** is the whole instrument — chart wheel, calculated tables,
the six-movement reading, and an appendix — assembled as one document in the
tradition of a printed Astro\*Intelligence horoscope.

The governing principle is simple and easy to get wrong: **the apparatus frames
the prose, it never interrupts it.** Data belongs at the front and the back.
Once the reading proper begins, it runs unbroken to the end — no tables, no
degree citations in parentheses, no methodology. A reader who hits a positions
grid in the middle of a paragraph about their mother has been thrown out of the
document, and the spell does not come back.

## Build order

Assemble in a working directory so the assets travel with the text:

```
<name>-report/
├── report.md
├── chart-wheel.png      (referenced from report.md)
└── chart-wheel.svg      (vector original, for print)
```

1. **Calculate.** `calculate_chart.py … --quincunx > chart.json` (add `--vedic`
   for a Jyotish report, `--orbs wide --minor-aspects` when the reading turns
   on a contact near an orb boundary).
2. **Draw.** `draw_chart.py chart.json --out chart-wheel.svg --png chart-wheel.png
   --title "<name or title>" --subtitle "<date · place>"`.
3. **Tabulate.** `chart_tables.py chart.json --section <block>` for each block
   you need. Never hand-type a degree; transcription is where errors enter a
   document, and one wrong minute discredits everything around it.
4. **Weight and detect themes** per synthesis.md, then **compose** the movements
   per voice.md — dialect profile first, amplification throughout.
5. **Assemble** in the order below and deliver the folder (or a zip of it) so
   the image resolves.

## Document order

**I. Title page.** The chart-derived title (voice.md, "Titling a portrait"), the
line *A psychological portrait of the natal chart* (or *A Vedic portrait…*), and
the birth line: date · time · place · zodiac and house system. Nothing else.

**II. The chart.** The wheel, full width, immediately after the title page:

```markdown
![Natal chart wheel](chart-wheel.png)
```

Beneath it, the **birth data** block (`--section birth`), and a three-or-four
sentence note on how to read the wheel — Ascendant at the left, signs
counter-clockwise, houses numbered from the Ascendant, red lines for the hard
aspects that build engines and blue for the flowing ones, dashed for minor. Say
it in the register, not as a manual: the reader is being handed a map of their
own weather and should be told what the marks mean once, warmly.

**III. The chart at a glance.** Positions, angles, element and mode
distribution, and the chart signature (`--section positions`, `angles`,
`distribution`, `signature`). For a Vedic report add the lagna, lagna lord, and
dasha table (`--section vedic`). This is the last data the reader sees before
the prose begins.

**III-b. The synthesis wheel.** After the data blocks, close the front matter
with the reading's argument drawn: the same wheel with `--themes`, a JSON file
mapping each detected theme to its bodies and a colour. Aspect lines whose two
endpoints share a theme take that theme's colour; everything else recedes.
This is the two-witness rule made visible — the one picture no competitor has,
because it renders the *interpretation*, not the geometry. Introduce it with a
short key naming each colour's theme in the register.

**IV. The reading.** The six movements, uninterrupted: overture → ground floor →
inner cast → mirror → summit → integration, each titled for this chart, each
carrying one properly told myth and one concrete daily vignette. This is the
document; everything else is scaffolding around it. 2,500–4,500 words.

Head each movement with its own small thematic wheel (`--size 620 --themes
<file> --highlight <bodies> --title "<movement title>"`): only the placements
that movement discusses stay at full ink, everything else falls back to a
whisper, and the movement's aspect lines brighten. The reader sees, before
reading a word, *where in their sky this chapter lives*. Images between
movements are the one sanctioned exception to "the apparatus never interrupts
the prose" — they are the prose's own illustrations, not data.

**V. Appendix — the aspects in full.** The complete aspect table
(`--section aspects`), after the reading, for the reader who wants to check the
working. Precede it with one line explaining that the reading drew on the
tightest of these and that orb is a convention, not a fact.

**VI. Colophon.** Four or five lines: ephemeris used, house system, orb profile,
zodiac, and the closing statement that this is a mirror rather than a map —
that the chart describes the cast and the script remains theirs. This is where
the disclaimer lives, so it never has to appear anywhere else.

## Notes on the wheel

Draw the wheel for the zodiac the report is written in — a Vedic report gets the
sidereal wheel with whole-sign cusps, not a tropical one. For a dual-zodiac
Holistic report, draw **both** and place them side by side under a single
heading, with a sentence naming what shifts between them; do not interleave two
wheels through the document.

If Chromium is unavailable and only the SVG renders, reference the SVG instead
and note that a PNG can be produced on a machine with a browser. Never ship a
report whose image link is broken — check that the file exists beside the
markdown before delivering.
