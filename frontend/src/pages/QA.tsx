import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, HttpError } from "../api/client";
import type { QaResponse } from "../api/types";
import SectionTitle from "../components/SectionTitle";
import Loading from "../components/Loading";
import Markdown from "../components/Markdown";
import MatchChips from "../components/MatchChips";

export default function QA() {
  const [question, setQuestion] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resp, setResp] = useState<QaResponse | null>(null);

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const yn = year.trim() ? Number(year.trim()) : undefined;
      const filters =
        author.trim() || (yn && Number.isFinite(yn))
          ? {
              author: author.trim() || undefined,
              publish_year: yn && Number.isFinite(yn) ? yn : undefined,
            }
          : undefined;
      setResp(await api.qaAnswer({ question: question.trim(), filters }));
    } catch (e2) {
      setErr(e2 instanceof HttpError ? e2.message : String(e2));
      setResp(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="kicker mb-3">// rag-qa</div>
        <h1 className="font-display font-bold text-2xl">智能问答</h1>
        <p className="mt-2 text-text-2 text-sm max-w-2xl leading-relaxed">
          提出一个研究问题，系统自动检索证据文献作 RAG 增强，直接回答你的问题（非综述），并在下方给出参考文献表。
        </p>
      </div>

      <form onSubmit={run} className="term-panel p-4">
        <div className="kicker mb-2">question · 你的问题</div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="例如：数智时代文化生产为什么会出现异化？有哪些超越路径？"
          className="input-term resize-y font-sans"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-term btn-primary" disabled={loading || !question.trim()}>
            {loading ? "answering…" : "▸ 提问"}
          </button>
          <button
            type="button"
            className="kicker text-text-3 hover:text-cyan transition-colors"
            onClick={() => setShowFilters((v) => !v)}
          >
            {showFilters ? "▾ 收起过滤" : "▸ 可选过滤"}
          </button>
        </div>
        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-3 fade-in">
            <label className="block">
              <span className="kicker">author · 作者</span>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="input-term mt-1" />
            </label>
            <label className="block">
              <span className="kicker">year · 年份</span>
              <input value={year} onChange={(e) => setYear(e.target.value)} className="input-term mt-1 mono tnum" placeholder="2024" />
            </label>
          </div>
        )}
      </form>

      {loading && <Loading label="RETRIEVING & REASONING" />}
      {err && (
        <div className="term-panel px-4 py-3 mono text-sm text-red" style={{ borderColor: "var(--red)" }}>
          ERROR · {err}
        </div>
      )}

      {resp && (
        <>
          {!resp.evidence_sufficient && (
            <div
              className="term-panel px-4 py-3 text-sm flex items-center gap-2"
              style={{ borderColor: "var(--red)", color: "var(--red)" }}
            >
              <span className="mono">⚠</span> 检索到的相关文献较少，以下结论可信度有限。
            </div>
          )}
          <section>
            <SectionTitle>answer · 回答</SectionTitle>
            <div className="term-panel p-5">
              <Markdown source={resp.answer} />
            </div>
          </section>

          {resp.references?.length > 0 && (
            <section>
              <SectionTitle>
                <span>references · 参考文献表</span>
              </SectionTitle>
              <div className="term-panel overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left">
                      {["#", "标题", "作者", "年份", "命中", "分数", "证据"].map((h) => (
                        <th
                          key={h}
                          className="mono text-[11px] uppercase tracking-wide text-text-3 px-3 py-2 border-b border-line-2 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resp.references.map((r) => (
                      <ReferenceRow key={r.paper_id + r.rank} r={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ReferenceRow({
  r,
}: {
  r: QaResponse["references"][number];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="border-b border-line align-top hover:bg-bg-2 transition-colors">
        <td className="mono text-amber tnum px-3 py-2.5">{String(r.rank).padStart(2, "0")}</td>
        <td className="px-3 py-2.5 min-w-[220px]">
          <Link
            to={`/paper/${encodeURIComponent(r.paper_id)}`}
            className="text-text hover:text-cyan transition-colors"
          >
            {r.title}
          </Link>
          {r.doi && <div className="mono text-[11px] text-text-3 mt-0.5">{r.doi}</div>}
        </td>
        <td className="px-3 py-2.5 text-text-2 whitespace-nowrap">{r.author || "—"}</td>
        <td className="px-3 py-2.5 mono tnum text-amber">{r.year || "—"}</td>
        <td className="px-3 py-2.5">
          <MatchChips matchedBy={r.matched_by} />
        </td>
        <td className="px-3 py-2.5 mono tnum text-cyan">{r.score?.toFixed(2)}</td>
        <td className="px-3 py-2.5">
          {r.snippet ? (
            <button onClick={() => setOpen((v) => !v)} className="kicker text-cyan hover:text-text">
              {open ? "▾" : "▸"}
            </button>
          ) : (
            <span className="text-text-3">—</span>
          )}
        </td>
      </tr>
      {open && r.snippet && (
        <tr className="border-b border-line">
          <td />
          <td colSpan={6} className="px-3 pb-3">
            <p className="fade-in text-[13px] leading-relaxed text-text-2 border-l-2 border-line-2 pl-3 whitespace-pre-wrap">
              {r.snippet}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
