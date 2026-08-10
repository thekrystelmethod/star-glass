import { useEffect, useState } from "react";
import { CODEX_POINT_FILE, loadPointFile } from "./codex";

// The mythic layer: every placement in the Codex carries an authored archetype
// title ("The Lamp on the Tide" for Sun in Pisces). This hook resolves those
// titles for a set of bodies so the interface can lead with the story and let
// the technical label follow. Pure retrieval — titles were authored at build
// time and are cached per point file.

export interface ArchetypeRequest {
  body: string;
  sign: string;
}

export function useArchetypes(requests: ArchetypeRequest[]): Record<string, string> {
  const [titles, setTitles] = useState<Record<string, string>>({});
  const key = requests.map((request) => `${request.body}:${request.sign}`).sort().join("|");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const resolved: Record<string, string> = {};
      await Promise.all(requests.map(async ({ body, sign }) => {
        const stem = CODEX_POINT_FILE[body];
        if (!stem || !sign) return;
        try {
          const file = await loadPointFile(stem);
          const entry = file.in_sign[sign.toLowerCase()];
          if (entry?.title) resolved[body] = entry.title;
        } catch (_) { /* the codex is a grace note, never a blocker */ }
      }));
      if (!cancelled) setTitles(resolved);
    })();
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return titles;
}
