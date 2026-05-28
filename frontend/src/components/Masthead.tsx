import { Link } from "react-router-dom";
import { dateLine, toCnNumber } from "../lib/format";

interface MastheadProps {
  volume?: number;
  issue?: number;
}

/**
 * Two-line newspaper masthead.
 * Row 1: volume (left) · journal name (centered) · date (right)
 */
export default function Masthead({ volume = 1, issue = 3 }: MastheadProps) {
  return (
    <header className="border-b border-ink pt-6">
      {/* top meta strip */}
      <div className="border-t border-b border-rule py-2">
        <div className="max-w-column mx-auto px-6 grid grid-cols-3 items-center text-[0.72rem]">
          <div className="font-serif text-ink-2 tracking-wider">
            第 <span className="font-display text-ink">{toCnNumber(volume)}</span> 卷
            <span className="mx-2 text-ink-3">·</span>
            第 <span className="font-display text-ink">{toCnNumber(issue)}</span> 期
          </div>
          <div className="font-mono tracking-[0.16em] uppercase text-ink-3 text-center">
            Vol. <span className="tnum">{String(volume).padStart(2, "0")}</span>
            <span className="mx-1.5">·</span>
            No. <span className="tnum">{String(issue).padStart(2, "0")}</span>
          </div>
          <div className="font-mono tracking-[0.18em] uppercase text-ink-3 text-right tnum">
            {dateLine()}
          </div>
        </div>
      </div>

      {/* main masthead title */}
      <div className="max-w-column mx-auto px-6 py-7 text-center">
        <Link to="/" className="inline-block">
          <h1 className="font-display font-black text-ink-dark leading-none tracking-tight"
              style={{ fontSize: "clamp(2.6rem, 5.4vw, 4.6rem)", fontVariationSettings: '"opsz" 144' }}>
            文獻檢索與分析學報
          </h1>
          <div className="mt-2 font-display italic text-ink-3 text-[0.95rem] tracking-wide">
            Journal of Literature Retrieval &amp; Analysis
          </div>
        </Link>
      </div>
    </header>
  );
}
