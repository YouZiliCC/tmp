import { Link } from "react-router-dom";
import type { Hit } from "../api/types";
import { firstAuthorEtAl, padOrdinal } from "../lib/format";
import Chip from "./Chip";
import ExpandableText from "./ExpandableText";
import ScoreBar from "./ScoreBar";
import Checkbox from "./Checkbox";

interface ResultRowProps {
  hit: Hit;
  index: number;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (next: boolean) => void;
  scoreMax?: number;
  className?: string;
}

export default function ResultRow({
  hit,
  index,
  selectable,
  selected,
  onToggle,
  scoreMax = 1,
  className = "",
}: ResultRowProps) {
  return (
    <article className={`j-row grid gap-x-6 items-start ${className}`}
             style={{ gridTemplateColumns: "78px 1fr 200px" }}>
      {/* 序号 */}
      <div className="pt-1 flex items-start gap-2">
        {selectable && (
          <Checkbox
            checked={!!selected}
            onChange={(v) => onToggle?.(v)}
          />
        )}
        <span className="font-mono text-[0.86rem] text-ink-3 tnum tracking-wider">
          {padOrdinal(index + 1, 4)}
        </span>
      </div>

      {/* 主体 */}
      <div>
        <Link
          to={`/paper/${encodeURIComponent(hit.paper_id)}`}
          className="font-display text-[1.32rem] leading-[1.22] text-ink-dark hover-uline"
          style={{ fontVariationSettings: '"opsz" 72' }}
        >
          {hit.title}
        </Link>
        <div className="mt-1.5 font-mono text-[0.74rem] tracking-wider text-ink-3 uppercase tnum">
          <span>{hit.year}</span>
          <span className="mx-2">·</span>
          <span className="normal-case font-serif text-ink-2 italic">
            {hit.journal}
          </span>
          <span className="mx-2">·</span>
          <span className="normal-case">{firstAuthorEtAl(hit.author)}</span>
        </div>
        <div className="mt-3">
          <ExpandableText text={hit.abstract_preview ?? ""} limit={200} />
        </div>
        {((hit.matched_fields?.length ?? 0) > 0 || (hit.keywords ?? "").length > 0) ? (
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            {hit.matched_fields?.map((f) => (
              <Chip key={`m-${f}`} tone="accent" title="命中字段">
                {f}
              </Chip>
            ))}
            {(hit.keywords ?? "")
              .split(/[,;，；、\s]+/)
              .map((k) => k.trim())
              .filter(Boolean)
              .slice(0, 5)
              .map((k) => (
                <Chip key={`k-${k}`}>{k}</Chip>
              ))}
          </div>
        ) : null}
      </div>

      {/* 右侧 score */}
      <div className="pt-2 flex flex-col items-end gap-2">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-3">
          Rank
          <span className="ml-2 text-vermillion tnum">
            #{String(hit.rank ?? index + 1).padStart(2, "0")}
          </span>
        </div>
        <ScoreBar score={hit.score ?? 0} max={scoreMax} width={140} />
      </div>
    </article>
  );
}
