import { FormEvent, useMemo, useState } from "react";
import { api } from "../api/client";
import type {
  AnalyzeGenerateResponse,
  Hit,
  SmartSearchResponse,
} from "../api/types";
import CitationList from "../components/CitationList";
import Kicker from "../components/Kicker";
import ResultRow from "../components/ResultRow";
import RewriteCard from "../components/RewriteCard";
import RuleHr from "../components/RuleHr";

export default function SmartSearch() {
  const [q, setQ] = useState("");
  const [resp, setResp] = useState<SmartSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"golden" | "bm25" | "vector">("golden");

  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalyzeGenerateResponse | null>(null);
  const [reportErr, setReportErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    setReport(null);
    setSelected({});
    try {
      const data = await api.searchSmart({ q: q.trim() });
      setResp(data);
    } catch (er) {
      setErr((er as Error).message);
      setResp(null);
    } finally {
      setLoading(false);
    }
  }

  const list: Hit[] = useMemo(() => {
    if (!resp) return [];
    if (tab === "bm25") return resp.list_bm25 ?? [];
    if (tab === "vector") return resp.list_vector ?? [];
    return resp.golden ?? [];
  }, [resp, tab]);

  const scoreMax = useMemo(
    () => (list.length ? Math.max(...list.map((h) => h.score || 0), 1) : 1),
    [list]
  );

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  async function runAnalyze() {
    if (selectedIds.length === 0) return;
    setAnalyzing(true);
    setReport(null);
    setReportErr(null);
    try {
      const data = await api.analyzeGenerate({ q, paper_ids: selectedIds });
      setReport(data);
    } catch (er) {
      setReportErr((er as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      {/* === Epigraph === */}
      <section className="mb-8">
        <Kicker block>Section II · Generative Analysis</Kicker>
        <h2
          className="font-display font-black text-ink-dark leading-none mt-3"
          style={{ fontSize: "clamp(2.4rem, 4.8vw, 3.6rem)", fontVariationSettings: '"opsz" 144' }}
        >
          智能检索
          <span className="font-display italic font-light text-ink-3 ml-3"
                style={{ fontSize: "0.55em" }}>
            ask the archive a question
          </span>
        </h2>
        <p className="epigraph mt-3 max-w-3xl">
          自然语言提问 → 查询包重写 → BM25 ∪ 向量检索 → 勾选 → 生成式综述。
        </p>
      </section>

      {/* === Big prompt === */}
      <form onSubmit={onSubmit} className="mb-12">
        <Kicker block>Prompt · 研究问题</Kicker>
        <div className="mt-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="提出你的研究问题，例如：数字化转型如何影响基层治理？"
            className="big-prompt"
            autoFocus
          />
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button type="submit" className="btn-block" disabled={loading || !q.trim()}>
            {loading ? "rewriting…" : "Begin · 开始检索"}
          </button>
          <span className="font-mono text-[0.72rem] text-ink-3 uppercase tracking-[0.14em]">
            ⌘/Ctrl + Enter to submit
          </span>
        </div>
      </form>

      {err && (
        <div className="mb-8 border border-vermillion p-4 font-mono text-[0.84rem] text-vermillion">
          ERROR · {err}
        </div>
      )}

      {resp && (
        <>
          {/* === Rewrite card === */}
          <RewriteCard rewrite={resp.rewrite} className="mb-10" />

          {/* === Tabs === */}
          <section>
            <div className="flex items-end justify-between">
              <div>
                <Kicker block>Ranked Lists · 排行榜</Kicker>
                <h3 className="section-title mt-2">候选论文</h3>
              </div>
              <div className="flex gap-2">
                {([
                  ["golden", "Golden · 综合榜"],
                  ["bm25", "BM25 · 关键词"],
                  ["vector", "Vector · 稠密"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={[
                      "px-3 py-1.5 border font-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors",
                      tab === k
                        ? "border-ink text-ink bg-paper-2"
                        : "border-rule text-ink-3 hover:border-ink hover:text-ink",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <RuleHr variant="thick" className="mt-3" />

            {list.length === 0 ? (
              <div className="mt-10 font-serif text-ink-3 italic text-center py-12">
                — 此榜单无结果 ·  No hits in this list —
              </div>
            ) : (
              <div className="mt-3 stagger">
                {list.map((hit, i) => (
                  <ResultRow
                    key={hit.paper_id + i}
                    hit={hit}
                    index={i}
                    scoreMax={scoreMax}
                    selectable
                    selected={!!selected[hit.paper_id]}
                    onToggle={(v) =>
                      setSelected((s) => ({ ...s, [hit.paper_id]: v }))
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* === Analyze button === */}
          <section className="mt-12 border-t border-ink pt-8 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <Kicker block>Composition · 进入分析</Kicker>
              <div className="font-serif mt-2 text-ink-2">
                已勾选{" "}
                <span className="font-mono text-vermillion tnum">
                  {String(selectedIds.length).padStart(2, "0")}
                </span>{" "}
                篇论文，将作为引文库进入综述。
              </div>
            </div>
            <button
              className="btn-block"
              disabled={selectedIds.length === 0 || analyzing}
              onClick={runAnalyze}
            >
              {analyzing ? "composing…" : "Generate · 生成分析报告"}
            </button>
          </section>
        </>
      )}

      {/* === Report === */}
      {reportErr && (
        <div className="mt-8 border border-vermillion p-4 font-mono text-[0.84rem] text-vermillion">
          ERROR · {reportErr}
        </div>
      )}
      {report && (
        <article className="mt-14 fade-up">
          <Kicker block>Report · 分析报告</Kicker>
          <h2 className="section-title mt-2" style={{ fontSize: "2.4rem" }}>
            综述
            <span className="font-display italic font-light text-ink-3 ml-2 text-[0.5em]">
              an editorial synthesis
            </span>
          </h2>
          <RuleHr variant="thick" className="mt-3" />

          <div className="grid grid-cols-12 gap-8 mt-8">
            <div className="col-span-12 md:col-span-8">
              <Kicker block>Abstract · 摘要</Kicker>
              <div className="body-prose mt-3 whitespace-pre-wrap">
                {report.answer}
              </div>

              <div className="mt-12">
                <Kicker block>Citations · 引文</Kicker>
                <h4 className="section-title mt-2" style={{ fontSize: "1.4rem" }}>
                  参考文献
                </h4>
                <RuleHr className="mt-2 mb-4" />
                <CitationList citations={report.citations ?? []} />
              </div>
            </div>

            <aside className="col-span-12 md:col-span-4 md:border-l md:border-rule md:pl-8">
              <Kicker block>Findings · 命中要点</Kicker>
              <ul className="mt-3 space-y-3 font-serif text-[0.96rem]">
                {(report.citations ?? []).slice(0, 6).map((c, i) => (
                  <li key={c.paper_id + i} className="grid grid-cols-[36px_1fr] gap-2">
                    <span className="font-mono text-vermillion text-[0.78rem] tnum">
                      [{String(i + 1).padStart(2, "0")}]
                    </span>
                    <span className="text-ink-2 leading-[1.55]">
                      {c.title}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </article>
      )}
    </div>
  );
}
