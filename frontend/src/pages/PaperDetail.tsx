import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Paper } from "../api/types";
import Chip from "../components/Chip";
import Kicker from "../components/Kicker";
import RuleHr from "../components/RuleHr";
import { citationGB, joinAuthors, splitKeywords } from "../lib/format";

export default function PaperDetail() {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    api
      .paper(id)
      .then(setPaper)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-[0.78rem] tracking-[0.18em] text-ink-3 uppercase">
        loading…
      </div>
    );
  }
  if (err) {
    return (
      <div className="py-20 text-center">
        <div className="border border-vermillion p-6 inline-block font-mono text-[0.86rem] text-vermillion">
          ERROR · {err}
        </div>
        <div className="mt-6">
          <Link to="/search" className="text-link">← 返回检索</Link>
        </div>
      </div>
    );
  }
  if (!paper) return null;

  const year = paper.publish_year;
  const journal = paper.source_journal;
  const keywordList = splitKeywords(paper.keywords);
  const citation = citationGB({
    author: paper.author,
    title: paper.title,
    journal: journal ?? "",
    year: year ?? "",
    doi: paper.doi,
  });

  function copy() {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(citation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <article className="fade-up">
      {/* === breadcrumb / kicker === */}
      <div className="mb-2">
        <Link to="/search" className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-3 hover:text-ink">
          ← Back to Index · 返回检索
        </Link>
      </div>

      <Kicker block>Article · 文章</Kicker>
      <h1
        className="font-display font-black text-ink-dark leading-[1.04] mt-3"
        style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontVariationSettings: '"opsz" 144' }}
      >
        {paper.title}
      </h1>

      <div className="mt-4 font-mono text-[0.78rem] uppercase tracking-[0.16em] text-ink-3 flex flex-wrap gap-x-3 gap-y-1 tnum">
        {paper.doi && <span>DOI · {paper.doi}</span>}
        {year ? <><span>·</span><span>{year}</span></> : null}
        {journal && (
          <>
            <span>·</span>
            <span className="normal-case italic text-ink-2 font-serif">
              {journal}
            </span>
          </>
        )}
      </div>

      <RuleHr variant="thick" className="mt-5" />

      <div className="grid grid-cols-12 gap-10 mt-10">
        {/* MAIN COLUMN */}
        <div className="col-span-12 md:col-span-8">
          <section>
            <Kicker block>Abstract · 摘要</Kicker>
            <div className="body-prose mt-3">
              {paper.abstract || "（暂无摘要）"}
            </div>
          </section>

          {paper.research_design_text && (
            <section className="mt-10">
              <Kicker block>Research Design · 研究设计</Kicker>
              <div className="body-prose mt-3">{paper.research_design_text}</div>
            </section>
          )}

          {/* CHUNKS */}
          {paper.chunks?.length ? (
            <section className="mt-12">
              <Kicker block>Sections · 段落 (Chunks)</Kicker>
              <h3 className="section-title mt-2" style={{ fontSize: "1.5rem" }}>
                正文切分
              </h3>
              <RuleHr className="mt-2 mb-6" />
              <div className="space-y-8">
                {paper.chunks.map((c, i) => (
                  <div key={c.chunk_id ?? i} className="grid grid-cols-[64px_1fr] gap-5">
                    <div className="font-display font-black text-ink-dark tnum"
                         style={{ fontSize: "1.6rem", lineHeight: 1, fontVariationSettings: '"opsz" 144' }}>
                      §{((c.chunk_index ?? i) + 1).toString()}
                    </div>
                    <div>
                      <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-3 mb-1">
                        {`chunk #${(c.chunk_index ?? i) + 1}${
                          c.paragraph_index !== undefined && c.paragraph_index >= 0
                            ? ` · ¶${c.paragraph_index}`
                            : ""
                        }`}
                      </div>
                      <p className="font-serif text-[1rem] leading-[1.75] text-ink whitespace-pre-wrap">
                        {c.chunk_text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* CITATION */}
          <section className="mt-16 border-t border-ink pt-6">
            <Kicker block>Citation · 引用格式</Kicker>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-4 items-start">
              <p className="font-serif text-[1rem] leading-[1.75] text-ink">
                {citation}
              </p>
              <button
                type="button"
                onClick={copy}
                className="btn-ghost shrink-0"
              >
                {copied ? "copied ✓" : "copy · 复制"}
              </button>
            </div>
            <div className="mt-1 font-mono text-[0.66rem] text-ink-3 tracking-[0.14em] uppercase">
              format · GB/T 7714 (approx.)
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="col-span-12 md:col-span-4 md:border-l md:border-rule md:pl-8">
          <section>
            <Kicker block>Authors · 作者</Kicker>
            <div className="mt-2 font-serif text-[1rem] text-ink">
              {joinAuthors(paper.author) || "—"}
            </div>
          </section>

          {keywordList.length > 0 ? (
            <section className="mt-8">
              <Kicker block>Keywords · 关键词</Kicker>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {keywordList.map((k) => (
                  <Chip key={k}>{k}</Chip>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-10 border-t border-rule pt-5">
            <Kicker block>Identifier · 标识</Kicker>
            <dl className="mt-3 space-y-1.5 font-mono text-[0.78rem]">
              <div className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="text-ink-3 uppercase tracking-wider text-[0.66rem]">paper_id</dt>
                <dd className="text-ink-2 break-all">{paper.paper_id}</dd>
              </div>
              {paper.doi && (
                <div className="grid grid-cols-[90px_1fr] gap-2">
                  <dt className="text-ink-3 uppercase tracking-wider text-[0.66rem]">doi</dt>
                  <dd className="text-ink-2 break-all">{paper.doi}</dd>
                </div>
              )}
              <div className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="text-ink-3 uppercase tracking-wider text-[0.66rem]">chunks</dt>
                <dd className="text-ink-2 tnum">{paper.chunks?.length ?? 0}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </article>
  );
}
