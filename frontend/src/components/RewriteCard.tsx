import type { Rewrite } from "../api/types";
import Chip from "./Chip";
import Kicker from "./Kicker";

interface RewriteCardProps {
  rewrite: Rewrite;
  className?: string;
}

function ChipRow({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="grid gap-2 py-3 border-t border-rule-2"
         style={{ gridTemplateColumns: "150px 1fr" }}>
      <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-3 pt-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((x, i) => (
          <Chip key={`${label}-${i}`}>{x}</Chip>
        ))}
      </div>
    </div>
  );
}

export default function RewriteCard({ rewrite, className = "" }: RewriteCardProps) {
  const { filter_conditions, search_payload } = rewrite;
  const filters = Object.entries(filter_conditions ?? {});
  return (
    <section className={`border border-rule bg-card ${className}`}>
      <header className="px-7 pt-6">
        <Kicker block>Query Rewrite · 查询包重写</Kicker>
        <h3 className="section-title mt-2">查询包</h3>
        <p className="font-serif italic text-ink-3 mt-1 text-[0.95rem]">
          A typeset of the parsed search intent.
        </p>
      </header>

      <div className="px-7 py-5">
        {/* filter conditions block */}
        <div className="mb-6">
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-3 border-b border-ink pb-1 mb-2">
            §1 · Filter Conditions · 过滤条件
          </div>
          {filters.length === 0 ? (
            <div className="font-mono text-[0.84rem] text-ink-3">— 无过滤条件 —</div>
          ) : (
            <ul className="font-mono text-[0.86rem] divide-y divide-rule-2">
              {filters.map(([k, v]) => (
                <li key={k} className="grid items-baseline py-1.5"
                    style={{ gridTemplateColumns: "180px 1fr" }}>
                  <span className="text-ink-3 uppercase tracking-wider text-[0.72rem]">
                    {k}
                  </span>
                  <span className="text-ink-2 break-all">
                    {v === null || v === undefined
                      ? "—"
                      : Array.isArray(v)
                      ? v.join(", ")
                      : typeof v === "object"
                      ? JSON.stringify(v)
                      : String(v)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* search payload */}
        <div>
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink-3 border-b border-ink pb-1 mb-2">
            §2 · Search Payload · 语义查询包
          </div>
          {search_payload?.core_semantic_sentence && (
            <p className="font-serif text-[1.02rem] leading-[1.75] text-ink mt-3 mb-2">
              <span className="fn">[core]</span>{" "}
              {search_payload.core_semantic_sentence}
            </p>
          )}
          <ChipRow label="ACADEMIC KEYWORDS" items={search_payload?.academic_keywords} />
          <ChipRow label="SYNONYMS & EXT." items={search_payload?.synonyms_and_extensions} />
          <ChipRow label="POTENTIAL VARS." items={search_payload?.potential_variables} />
          <ChipRow label="RESEARCH DESIGN" items={search_payload?.research_design_terms} />
        </div>
      </div>
    </section>
  );
}
