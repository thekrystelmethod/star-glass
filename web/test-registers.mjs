// Register-integrity gate for the StarGlass field.
//
// The register library is the single source of truth for every color and type
// token in the app. That only holds if nothing drifts away from it, so this
// harness checks the seams a data-driven theme system can quietly break:
//
//   1. every register carries the complete token set (a missing --atlas-text-3
//      doesn't throw, it inherits — silently, from whatever is above it)
//   2. every register resolves a pairing, and every pairing named exists
//   3. bound registers are absent from the pickable set, and every retired id
//      still resolves forward to a live register
//   4. the compiled stylesheet declares each register self-contained: the
//      display-face floor included, so a bound register worn by a container
//      never inherits the outer register's small-display face
//   5. index.html's pre-hydration GROUND map matches the library hex for hex,
//      and its font URL names every family FONT_TOKENS asks for
//   6. contrast: body text on its own ground clears WCAG AA, measured against
//      Plate — the register the field nominates as its accessibility reference
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const esbuild = await import(
  pathToFileURL(join(here, "node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js")).href
);

const work = mkdtempSync(join(tmpdir(), "register-gate-"));
await esbuild.build({
  entryPoints: [join(here, "src/theme/themes.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: join(work, "themes.mjs"),
  logLevel: "silent",
});
const field = await import(pathToFileURL(join(work, "themes.mjs")).href);

let failures = 0;
function expect(condition, message) {
  if (condition) return;
  console.error(`✗ ${message}`);
  failures += 1;
}

const {
  REGISTERS, FONT_TOKENS, PAIRINGS, REGISTER_PAIRING, REGISTER_ROLES,
  BOUND_REGISTERS, PICKABLE_REGISTER_IDS, RETIRED, DARK_REGISTER_IDS,
  DEFAULT_REGISTER_ID, DEFAULT_DARK_REGISTER_ID,
  resolveRegisterId, registerStyleSheet,
} = field;

/* 1 — token completeness ------------------------------------------------- */

const COLOR_TOKENS = [
  "--atlas-bg", "--atlas-panel", "--atlas-surface", "--atlas-border",
  "--atlas-text-1", "--atlas-text-2", "--atlas-text-3", "--atlas-text-4", "--atlas-text-5",
  "--atlas-accent", "--atlas-accent-soft", "--atlas-positive", "--atlas-warning",
  "--atlas-info", "--atlas-blend", "--atlas-tempo",
];
const TYPE_TOKENS = [
  "--font-display", "--font-body", "--font-label", "--font-mono", "--font-action",
  "--label-size", "--label-weight", "--label-style", "--label-tracking", "--label-transform",
  "--action-weight", "--action-style", "--action-tracking", "--shadow-soft",
];

expect(REGISTERS.length === 11, `expected 11 registers, found ${REGISTERS.length}`);

for (const register of REGISTERS) {
  for (const token of COLOR_TOKENS) {
    expect(register.tokens[token], `${register.id} is missing ${token}`);
  }
  const type = FONT_TOKENS[register.id];
  expect(type, `${register.id} has no FONT_TOKENS entry`);
  for (const token of TYPE_TOKENS) {
    expect(type?.[token], `${register.id} is missing ${token}`);
  }
  expect(REGISTER_ROLES[register.id], `${register.id} has no role — every register earns its place`);
  for (const slot of ["fire", "earth", "air", "water"]) {
    expect(register.wheel.element[slot], `${register.id} wheel is missing the ${slot} element`);
  }
  expect(register.wheel.theme_palette.length >= 6, `${register.id} palette is under six hues`);
}

/* 2 — pairings ----------------------------------------------------------- */

const pairingIds = new Set(PAIRINGS.map((pairing) => pairing.id));
for (const register of REGISTERS) {
  const pairing = REGISTER_PAIRING[register.id];
  expect(pairing, `${register.id} follows no pairing`);
  expect(pairingIds.has(pairing), `${register.id} follows "${pairing}", which is not a pairing`);
}

/* 3 — the bound/pickable split, and the retirement path ------------------ */

for (const id of Object.keys(BOUND_REGISTERS)) {
  expect(REGISTERS.some((register) => register.id === id), `bound register "${id}" is not in the field`);
  expect(!PICKABLE_REGISTER_IDS.includes(id), `bound register "${id}" is offered in the picker`);
}
expect(PICKABLE_REGISTER_IDS.length === 8, `expected 8 pickable registers, found ${PICKABLE_REGISTER_IDS.length}`);

for (const retired of RETIRED) {
  expect(
    !REGISTERS.some((register) => register.id === retired.id),
    `"${retired.id}" is retired but still in the field`,
  );
  expect(
    resolveRegisterId(retired.id) === retired.supersededBy,
    `a saved "${retired.id}" resolves to "${resolveRegisterId(retired.id)}", not "${retired.supersededBy}"`,
  );
}
expect(resolveRegisterId("nonsense") === DEFAULT_REGISTER_ID, "an unknown id must fall back to the default");
expect(resolveRegisterId(null) === DEFAULT_REGISTER_ID, "a null id must fall back to the default");
expect(PICKABLE_REGISTER_IDS.includes(DEFAULT_REGISTER_ID), "the light default must be pickable");
expect(PICKABLE_REGISTER_IDS.includes(DEFAULT_DARK_REGISTER_ID), "the dark default must be pickable");

/* 4 — the compiled stylesheet -------------------------------------------- */

const sheet = registerStyleSheet();
for (const register of REGISTERS) {
  // Both selectors, or the register loses a specificity tie with :root and
  // silently renders as whatever styles.css declares as the pre-paint default.
  expect(
    sheet.includes(`:root[data-theme="${register.id}"], [data-theme="${register.id}"] {`),
    `${register.id} must be selected as both :root[data-theme] and [data-theme]`,
  );
}
// Each block must be self-contained: a bound register worn by a container
// inherits from <html> for anything it does not declare itself.
const blocks = Object.fromEntries(
  sheet.split("\n\n").filter((block) => block.includes("--atlas-bg:")).map((block) => {
    const id = block.match(/:root\[data-theme="([^"]+)"\]/)[1];
    return [id, block];
  }),
);
for (const register of REGISTERS) {
  const block = blocks[register.id];
  expect(block?.includes("--font-display-sm:"), `${register.id} does not declare its own --font-display-sm`);
  expect(block?.includes("--font-display-min:"), `${register.id} does not declare its own --font-display-min`);
}
expect(
  blocks.bluehour?.includes("--font-display-min: 40px"),
  "Blue Hour's script must keep its 40px floor",
);

/* 5 — index.html has not drifted from the field -------------------------- */

const html = readFileSync(join(here, "index.html"), "utf8");
const groundBlock = html.match(/const GROUND = \{([\s\S]*?)\};/);
expect(groundBlock, "index.html has no GROUND map for the pre-hydration paint");
if (groundBlock) {
  const ground = {};
  for (const [, id, bg, ink] of groundBlock[1].matchAll(/(\w+): \['(#[0-9a-f]{6})', '(#[0-9a-f]{6})'\]/g)) {
    ground[id] = [bg, ink];
  }
  for (const register of REGISTERS) {
    const pair = ground[register.id];
    expect(pair, `index.html GROUND has no entry for ${register.id}`);
    if (!pair) continue;
    expect(
      pair[0] === register.tokens["--atlas-bg"].toLowerCase(),
      `${register.id} GROUND background is ${pair[0]}, the field says ${register.tokens["--atlas-bg"]}`,
    );
    expect(
      pair[1] === register.tokens["--atlas-text-1"].toLowerCase(),
      `${register.id} GROUND ink is ${pair[1]}, the field says ${register.tokens["--atlas-text-1"]}`,
    );
  }
  expect(
    Object.keys(ground).length === REGISTERS.length,
    `index.html GROUND has ${Object.keys(ground).length} entries for ${REGISTERS.length} registers`,
  );
}

const superseded = html.match(/const SUPERSEDED = \{([^}]*)\}/);
expect(superseded, "index.html has no SUPERSEDED map, so a retired id would land nowhere");
for (const retired of RETIRED) {
  expect(
    superseded?.[1].includes(`${retired.id}: '${retired.supersededBy}'`),
    `index.html does not carry "${retired.id}" forward to "${retired.supersededBy}"`,
  );
}

// Every family the registers name must be requested. Only quoted families are
// checked — bare stack entries (Georgia, system-ui) are system faces.
const fontHref = html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/)?.[1] ?? "";
expect(fontHref, "index.html does not load a webfont stylesheet");
const SYSTEM = new Set([
  "Bodoni 72", "Didot", "Iowan Old Style", "Palatino", "Palatino Linotype", "Georgia",
  "SFMono-Regular", "Avenir Next", "Avenir", "Consolas", "Liberation Mono",
  "Trajan Pro", "Pinyon Script", "Source Serif Pro", "Gentium Book Basic", "Bodoni Moda Fallback",
]);
const requested = new Set();
for (const [, family] of fontHref.matchAll(/family=([^:&]+)/g)) {
  requested.add(decodeURIComponent(family).replace(/\+/g, " "));
}
for (const [id, type] of Object.entries(FONT_TOKENS)) {
  for (const property of ["--font-display", "--font-display-sm", "--font-body", "--font-label", "--font-mono", "--font-action"]) {
    const stack = type[property];
    if (!stack) continue;
    for (const [, family] of stack.matchAll(/"([^"]+)"/g)) {
      if (SYSTEM.has(family)) continue;
      expect(requested.has(family), `${id} ${property} names "${family}", which index.html never loads`);
    }
  }
}

/* 6 — contrast, measured against Plate ----------------------------------- */

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// Body prose and its immediate ground: the pair a person actually reads a
// portrait in. AA for body text is 4.5:1.
for (const register of REGISTERS) {
  for (const [ink, ground, label] of [
    ["--atlas-text-1", "--atlas-bg", "primary ink on page"],
    ["--atlas-text-2", "--atlas-panel", "body ink on panel"],
    ["--atlas-text-3", "--atlas-panel", "secondary ink on panel"],
  ]) {
    const ratio = contrast(register.tokens[ink], register.tokens[ground]);
    expect(ratio >= 4.5, `${register.id}: ${label} is ${ratio.toFixed(2)}:1, under AA's 4.5`);
  }
  // Metadata and quiet labels are small but still have to be legible: AA
  // large-text (3:1) is the floor the field accepts for --atlas-text-4/5.
  for (const [ink, ground, label] of [
    ["--atlas-text-4", "--atlas-panel", "muted ink on panel"],
    ["--atlas-text-5", "--atlas-panel", "faint ink on panel"],
    ["--atlas-accent", "--atlas-panel", "accent on panel"],
  ]) {
    const ratio = contrast(register.tokens[ink], register.tokens[ground]);
    expect(ratio >= 3, `${register.id}: ${label} is ${ratio.toFixed(2)}:1, under 3:1`);
  }
}

// Plate is the reference the others are measured against — it should clear
// AAA (7:1) on its primary pair, or it is not a reference.
const plate = REGISTERS.find((register) => register.id === "plate");
expect(
  contrast(plate.tokens["--atlas-text-1"], plate.tokens["--atlas-bg"]) >= 7,
  "Plate is the accessibility reference and must clear AAA on primary ink",
);

// Dark registers must actually be dark, or color-scheme lies to the browser
// about form controls and scrollbars.
for (const id of DARK_REGISTER_IDS) {
  const register = REGISTERS.find((candidate) => candidate.id === id);
  expect(register, `DARK_REGISTER_IDS names "${id}", which is not in the field`);
  expect(
    register && luminance(register.tokens["--atlas-bg"]) < 0.25,
    `${id} is listed as dark but its ground is light`,
  );
}
for (const register of REGISTERS) {
  if (DARK_REGISTER_IDS.includes(register.id)) continue;
  expect(
    luminance(register.tokens["--atlas-bg"]) >= 0.25,
    `${register.id} is not listed as dark but its ground is`,
  );
}

if (failures) {
  console.error(`\n${failures} register check${failures === 1 ? "" : "s"} failed.`);
  process.exit(1);
}
console.log(`✓ register field: ${REGISTERS.length} registers, ${PICKABLE_REGISTER_IDS.length} pickable, ${Object.keys(BOUND_REGISTERS).length} bound, ${PAIRINGS.length} pairings — tokens, bindings, stylesheet, index.html and contrast all hold.`);
