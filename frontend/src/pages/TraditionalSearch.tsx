import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type {
  HistoryItem,
  Hit,
  TraditionalSearchRequest,
  TraditionalSearchResponse,
} from "../api/types";
import Field from "../components/Field";
import Kicker from "../components/Kicker";
import ResultRow from "../components/ResultRow";
import RuleHr from "../components/RuleHr";

const SORTS: { value: NonNullable<TraditionalSearchRequest["sort"]>; label: string }[] = [
  { value: "relevance", label: "相关性" },
  { value: "year", label: "年份 新→旧" },
];

export default function TraditionalSearch() {
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [journal, setJournal] = useState("");
  const [keywords, setKeywords] = useState("");
  const [sort, setSort] = useState<NonNullable<TraditionalSearchRequest["sort"]>>("relevance");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resp, setResp] = useState<TraditionalSearchResponse | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    api.history(8)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  async function runSearch(p = page) {
    setLoading(true);
    setErr(null);
    try {
      const yearNum = year.trim() ? Number(year.trim()) : undefined;
      const body: TraditionalSearchRequest = {
        q: q || undefined,
        author: author || undefined,
        year: yearNum && Number.isFinite(yearNum) ? yearNum : undefined,
        journal: journal || undefined,
        keywords: keywords.trim() || undefined,
        sort,
        page: p,
        page_size: pageSize,
      };
      const data = await api.searchTraditional(body);
      setResp(data);
      setPage(p);
    } catch (e) {
      setErr((e as Error).message);
      setResp(null);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(1);
  }

  const scoreMax = useMemo(() => {
    const arr = resp?.hits ?? [];
    return arr.length ? Math.max(...arr.map((h) => h.score || 0), 1) : 1;
  }, [resp]);

  const total = resp?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* === LEFT: Filter form === */}
      <aside className="col-span-12 md:col-span-3">
        <div className="md:sticky md:top-6">
          <Kicker block>Filters · 检索卡</Kicker>
          <h2 className="section-title mt-2 mb-5" style={{ fontSize: "1.6rem" }}>
            检索条件
          </h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              label="Query · 关键词"
              placeholder="任意词"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Field
              label="Author · 作者"
              placeholder="如 王某某"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <Field
              label="Year · 年份"
              placeholder="2023"
              mono
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <Field
              label="Journal · 刊名"
              placeholder="如 《社会学研究》"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
            />
            <Field
              label="Keywords · 关键词组"
              placeholder="以逗号或空格分隔"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              hint="example: 治理, 数字化, 公共服务"
            />

            <div>
              <div className="field-label mb-1.5">Sort · 排序</div>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((s) => (
                  <button
                    type="button"
                    key={s.value}
                    onClick={() => setSort(s.value)}
                    className={[
                      "px-2.5 py-1 border font-mono text-[0.7rem] uppercase tracking-[0.14em] transition-colors",
                      sort === s.value
                        ? "border-ink text-ink bg-paper-2"
                        : "border-rule text-ink-3 hover:border-ink hover:text-ink",
                    ].join(" ")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button type="submit" className="btn-block" disabled={loading}>
                {loading ? "Searching…" : "Search · 检索"}
              </button>
            </div>
          </form>

          {history.length > 0 && (
            <div className="mt-10">
              <Kicker block>Recent · 最近查询</Kicker>
              <ul className="mt-3 space-y-1.5">
                {history.map((h) => (
                  <li key={String(h.id)} className="flex items-baseline gap-2">
                    <span className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-ink-3">
                      {(h.mode ?? "").slice(0, 4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQ(h.query ?? "");
                        runSearch(1);
                      }}
                      className="font-serif text-[0.92rem] text-ink-2 hover:text-vermillion hover-uline text-left"
                    >
                      {h.query || h.filters || `#${h.id}`}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>

      {/* === MIDDLE: Results === */}
      <section className="col-span-12 md:col-span-9">
        <Kicker block>Results · 检索结果</Kicker>
        <div className="flex items-end justify-between mt-2 mb-4">
          <h2 className="section-title">目录页</h2>
          <div className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-ink-3 tnum">
            {loading
              ? "loading…"
              : resp
              ? `Total · ${total}  ·  Page ${page}/${totalPages}`
              : "ready"}
          </div>
        </div>
        <RuleHr variant="thick" />

        {err && (
          <div className="mt-6 border border-vermillion p-4 font-mono text-[0.84rem] text-vermillion">
            ERROR · {err}
          </div>
        )}

        {!resp && !loading && !err && (
          <div className="mt-10 font-serif text-ink-3 italic text-center py-12">
            — 在左侧填入检索条件，点击 Search ——
          </div>
        )}

        {resp && resp.hits.length === 0 && !loading && (
          <div className="mt-10 font-serif text-ink-3 italic text-center py-12">
            — 检索无结果 ·  No hits found —
          </div>
        )}

        {resp && resp.hits.length > 0 && (
          <div className="mt-4 stagger">
            {resp.hits.map((hit: Hit, i) => (
              <ResultRow
                key={hit.paper_id + i}
                hit={hit}
                index={(page - 1) * pageSize + i}
                scoreMax={scoreMax}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {resp && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              className="btn-ghost"
              disabled={page <= 1 || loading}
              onClick={() => runSearch(page - 1)}
            >
              ← Prev
            </button>
            <span className="font-mono text-[0.78rem] tnum text-ink-2 px-3">
              {String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
            </span>
            <button
              className="btn-ghost"
              disabled={page >= totalPages || loading}
              onClick={() => runSearch(page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
