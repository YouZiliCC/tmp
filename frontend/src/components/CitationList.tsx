import { useState } from "react";
import { Link } from "react-router-dom";
import type { Citation } from "../api/types";
import { citationGB, firstAuthorEtAl, splitKeywords } from "../lib/format";

interface Props {
  citations: Citation[];
}

/** Collapsible citation cards used by review/analyze results. */
export default function CitationList({ citations }: Props) {
  if (!citations?.length) return null;
  return (
    <ol className="space-y-2 stagger">
      {citations.map((c, i) => (
        <CitationItem key={c.paper_id || i} c={c} index={i + 1} />
      ))}
    </ol>
  );
}

function CitationItem({ c, index }: { c: Citation; index: number }) {
  const [open, setOpen] = useState(false);
  const evidence = c.top_chunk_text ?? c.chunk_text ?? "";
  const kws = splitKeywords(c.keywords).slice(0, 5);
  return (
    <li className="term-panel px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mono text-amber text-sm tnum pt-0.5 select-none">
          [{String(index).padStart(2, "0")}]
        </span>
        <div className="flex-1 min-w-0">
          <Link
            to={`/paper/${encodeURIComponent(c.paper_id)}`}
            className="font-display font-medium text-text hover:text-cyan transition-colors leading-snug"
          >
            {c.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-2">
            <span>{firstAuthorEtAl(c.author)}</span>
            <span className="text-text-3">//</span>
            <span className="mono tnum text-amber">{c.publish_year || "—"}</span>
            {c.doi ? (
              <>
                <span className="text-text-3">//</span>
                <span className="mono text-text-3">{c.doi}</span>
              </>
            ) : null}
            <span className="mono text-cyan tnum ml-auto">
              ▸ {c.relevance_score?.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {kws.map((k) => (
              <span key={k} className="chip">
                {k}
              </span>
            ))}
          </div>
          {evidence ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="mt-2 kicker text-cyan hover:text-text transition-colors"
            >
              {open ? "▾ 收起证据" : "▸ 展开证据片段"}
            </button>
          ) : null}
          {open && evidence ? (
            <p className="mt-2 fade-in text-[13px] leading-relaxed text-text-2 border-l-2 border-line-2 pl-3 whitespace-pre-wrap">
              {evidence}
            </p>
          ) : null}
          <p className="mt-2 mono text-[11px] text-text-3 break-words">
            {citationGB({
              author: c.author,
              title: c.title,
              journal: "",
              year: c.publish_year,
              doi: c.doi,
            })}
          </p>
        </div>
      </div>
    </li>
  );
}
