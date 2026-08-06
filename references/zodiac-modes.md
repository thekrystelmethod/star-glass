# Zodiac Modes

The skill speaks three dialects. Default to tropical unless the person asks
otherwise or has an established preference.

## Tropical (default)

The zodiac of Western psychological astrology — the Liz Greene lineage this
skill's voice descends from. Signs measured from the March equinox; seasonal-
archetypal symbolism. Run the calculator with `--zodiac tropical`. Nothing
further to decide.

## Sidereal (Lahiri)

Signs anchored to the stars, using the Lahiri ayanamsa. Run with
`--zodiac sidereal`. Interpret with the same lexicon and voice — this skill
applies the psychological-archetypal register to sidereal positions; it does
not switch to Vedic techniques (no dashas, no nakshatras) unless the person
asks, in which case say plainly that Vedic methodology is outside this skill's
canon.

## Dual-zodiac ("Holistic" method)

Both zodiacs computed and weighted equally — tropical and Lahiri sidereal read
as two exposures of one photograph, in the lineage of Jim Lewis-style
locational work. Run with `--zodiac dual`; the calculator returns both charts
plus a `dual_zodiac_sign_shifts` list — the placements that change sign between
zodiacs. Those shifts are where this mode earns its keep.

Rules for the dual reading:

- **Same sign in both zodiacs → one voice, doubled.** Read it once, with the
  note that both systems agree; agreement is itself weighty — treat such
  placements as having an extra witness for theme detection.
- **Sign shift → complementary octaves, not competitors.** Never frame the two
  positions as "really" one or the other, and never average them into a beige
  blend. The tropical position describes the *seasonal-psychological* octave
  (how the drive develops through the personality); the sidereal position the
  *stellar* octave (a second register of the same drive, often experienced as
  the quieter undertone). A Venus that is tropical Aries and sidereal Pisces
  contains both the pursuer and the dissolver — present the pair as a chord
  and ask what melody uses both notes. The shift cases are usually the most
  interesting material in a dual reading; give them room.
- **No double-counting.** House positions, angles, and aspects barely differ
  between zodiacs (aspects are angular separations and do not change; houses
  shift only by the ayanamsa's effect on cusps' signs). Detect themes ONCE,
  from the shared structure (aspects, houses, angularity), then let the two
  zodiacs color the sign-level expression. Do not count a Saturn square Moon
  twice because it appears in both outputs — it is one aspect.
- **Honesty about lineage.** There is no Greene precedent for dual-zodiac
  synthesis; this register is an extension of the tradition, not a citation of
  it. Carry that lightly (no repeated disclaimers), but if asked, say so.
