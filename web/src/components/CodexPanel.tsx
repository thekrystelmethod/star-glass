import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookMarked, LoaderCircle, X } from "lucide-react";
import {
  chipLabel,
  resolveNodeId,
  resolvePlacement,
  resolveRising,
  type CodexNode,
} from "../codex";

export type CodexTarget =
  | { kind: "placement"; body: string; sign: string; house: number }
  | { kind: "rising"; sign: string }
  | { kind: "node"; id: string };

interface CodexPanelProps {
  target: CodexTarget;
  onClose: () => void;
}

function resolveTarget(target: CodexTarget): Promise<CodexNode> {
  if (target.kind === "placement") return resolvePlacement(target.body, target.sign, target.house);
  if (target.kind === "rising") return resolveRising(target.sign);
  return resolveNodeId(target.id);
}

export function CodexPanel({ target, onClose }: CodexPanelProps) {
  const [node, setNode] = useState<CodexNode | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [trail, setTrail] = useState<CodexTarget[]>([]);
  const [current, setCurrent] = useState<CodexTarget>(target);
  const bodyRef = useRef<HTMLDivElement>(null);

  // A fresh click on the chart resets the trail to the new origin.
  useEffect(() => { setCurrent(target); setTrail([]); }, [target]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    resolveTarget(current)
      .then((resolved) => { if (!cancelled) { setNode(resolved); bodyRef.current?.scrollTo({ top: 0 }); } })
      .catch(() => { if (!cancelled) setError("This page of the Codex is not written yet."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [current]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const follow = (id: string) => {
    setTrail((prior) => [...prior, current]);
    setCurrent({ kind: "node", id });
  };

  const back = () => {
    setTrail((prior) => {
      if (!prior.length) return prior;
      setCurrent(prior[prior.length - 1]);
      return prior.slice(0, -1);
    });
  };

  return (
    <>
      <div className="codex-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="codex-panel" role="dialog" aria-modal="true" aria-label="The Codex">
        <header className="codex-header">
          <div className="codex-mark"><BookMarked size={15} aria-hidden="true" /><span>The Codex</span></div>
          <div className="codex-header-actions">
            {trail.length > 0 && (
              <button type="button" className="codex-icon-button" onClick={back} aria-label="Back">
                <ArrowLeft size={15} />
              </button>
            )}
            <button type="button" className="codex-icon-button" onClick={onClose} aria-label="Close the Codex">
              <X size={15} />
            </button>
          </div>
        </header>

        <div className="codex-body" ref={bodyRef}>
          {loading && (
            <div className="codex-loading" role="status">
              <LoaderCircle size={18} aria-hidden="true" />
              <span>Opening the Codex…</span>
            </div>
          )}
          {!loading && error && <p className="codex-error">{error}</p>}
          {!loading && !error && node && (
            <article>
              <header className="codex-node-heading">
                {node.glyph && <span className="codex-glyph" aria-hidden="true">{node.glyph}&#xFE0E;</span>}
                <h2>{node.heading}</h2>
                {node.subheading && <p className="codex-subheading">{node.subheading}</p>}
              </header>
              {node.canonLine && <p className="codex-canon">{node.canonLine}</p>}

              {node.sections.map((section) => (
                <section key={section.entry.id} className="codex-section">
                  {section.label && <p className="eyebrow">{section.label}</p>}
                  <h3>{section.entry.title}</h3>
                  {section.entry.body.map((paragraph) => <p key={paragraph.slice(0, 48)}>{paragraph}</p>)}
                  {section.entry.invitation && (
                    <p className="codex-invitation"><span aria-hidden="true">✦</span> {section.entry.invitation}</p>
                  )}
                </section>
              ))}

              {node.canonArc && <p className="codex-arc">{node.canonArc}</p>}

              {node.seeAlso.length > 0 && (
                <footer className="codex-see-also">
                  <p className="eyebrow">Follow the thread</p>
                  <div className="codex-chips">
                    {node.seeAlso.map((id) => (
                      <button key={id} type="button" onClick={() => follow(id)}>{chipLabel(id)}</button>
                    ))}
                  </div>
                </footer>
              )}
              <p className="codex-provenance">Authored, versioned, retrieved — never generated on click.</p>
            </article>
          )}
        </div>
      </aside>
    </>
  );
}
