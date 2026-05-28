import type { Citation } from "../api/types";
import { joinAuthors, splitKeywords } from "../lib/format";

interface CitationListProps {
  citations: Citation[];
  className?: string;
}

export default function CitationList({ citations, className = "" }: CitationListProps) {
  return (
    <ol className={`citation-list ${className}`}>
      {citations.map((c, i) => {
        const kws = splitKeywords(c.keywords);
        const chunk = c.chunk_text || c.top_chunk_text;
        return (
          <li key={`${c.paper_id}-${i}`}>
            <div>
              <span className="font-serif">{joinAuthors(c.author)}. </span>
              <span className="font-serif text-ink">{c.title}</span>
              <span className="font-serif italic text-ink-2">
                {" "}· {c.publish_year}
              </span>
              {c.doi && (
                <span className="font-mono text-[0.78rem] text-ink-3 ml-2">
                  DOI:{c.doi}
                </span>
              )}
              <span className="font-mono text-[0.72rem] text-vermillion ml-2 tnum">
                score {Number(c.relevance_score ?? 0).toFixed(3)}
              </span>
            </div>
            {kws.length > 0 ? (
              <div className="mt-1 font-mono text-[0.72rem] text-ink-3 tracking-wider">
                KEYWORDS · {kws.join(" / ")}
              </div>
            ) : null}
            {chunk && (
              <details className="mt-1.5 group">
                <summary className="font-mono text-[0.72rem] text-ink-3 cursor-pointer hover:text-ink list-none inline-flex items-center gap-1">
                  <span className="group-open:hidden">+ 展开原文片段</span>
                  <span className="hidden group-open:inline">− 收起原文片段</span>
                </summary>
                <div className="mt-2 pl-3 border-l border-rule font-serif text-[0.92rem] leading-[1.7] text-ink-2 whitespace-pre-wrap">
                  {chunk}
                </div>
              </details>
            )}
          </li>
        );
      })}
    </ol>
  );
}
