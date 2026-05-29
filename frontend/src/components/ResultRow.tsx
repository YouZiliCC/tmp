import { Link } from "react-router-dom";
import type { Hit } from "../api/types";
import { firstAuthorEtAl, splitKeywords } from "../lib/format";
import MatchChips from "./MatchChips";
import ScoreBar from "./ScoreBar";

interface Props {
  hit: Hit;
  index: number;
  scoreMax?: number;
}

/** A single search result row, links to /paper/:id. */
export default function ResultRow({ hit, index, scoreMax = 1 }: Props) {
  const kws = splitKeywords(hit.keywords).slice(0, 5);
  return (
    <Link
      to={`/paper/${encodeURIComponent(hit.paper_id)}`}
      className="term-panel term-panel-hover block px-4 py-3.5 group"
    >
      <div className="flex items-start gap-3">
        <span className="mono text-text-3 text-sm tnum pt-0.5 select-none">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display font-medium text-text leading-snug group-hover:text-cyan transition-colors">
              {hit.title}
            </h3>
            <ScoreBar score={hit.score} max={scoreMax} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-2">
            <span>{firstAuthorEtAl(hit.author)}</span>
            <span className="text-text-3">//</span>
            <span className="mono text-text-2">{hit.journal || "—"}</span>
            <span className="text-text-3">//</span>
            <span className="mono tnum text-amber">{hit.year || "—"}</span>
          </div>
          {hit.abstract_preview ? (
            <p className="mt-2 text-[13px] leading-relaxed text-text-2 line-clamp-2">
              {hit.abstract_preview}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <MatchChips fields={hit.matched_fields} />
            {kws.map((k) => (
              <span key={k} className="chip">
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
