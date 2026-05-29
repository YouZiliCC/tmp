import { FormEvent, useMemo, useState } from "react";
import { api } from "../api/client";
import type {
  Hit,
  SmartSearchResponse,
  TraditionalSearchRequest,
  TraditionalSearchResponse,
} from "../api/types";
import { HttpError } from "../api/client";
import SectionTitle from "../components/SectionTitle";
import ResultRow from "../components/ResultRow";
import Loading from "../components/Loading";

type Tab = "traditional" | "smart";

export default function Search() {
  const [tab, setTab] = useState<Tab>("traditional");
  return (
    <div className="space-y-6">
      <div>
        <div className="kicker mb-3">// retrieval</div>
        <h1 className="font-display font-bold text-2xl">文献检索</h1>
      </div>
      <div className="flex gap-1 border-b border-line">
        <button
          className={`tab-term ${tab === "traditional" ? "tab-active" : ""}`}
          onClick={() => setTab("traditional")}
        >
          文献检索 · indexing
        </button>
        <button
          className={`tab-term ${tab === "smart" ? "tab-active" : ""}`}
          onClick={() => setTab("smart")}
        >
          AI 增强检索 · generative
        </button>
      </div>
      {tab === "traditional" ? <Traditional /> : <Smart />}
    </div>
  );
}

/* ----------------------- 传统检索 ----------------------- */

function Traditional() {
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [journal, setJournal] = useState("");
  const [keywords, setKeywords] = useState("");
  const [sort, setSort] = useState<"relevance" | "year">("relevance");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resp, setResp] = useState<TraditionalSearchResponse | null>(null);

  async function run(p = page) {
    setLoading(true);
    setErr(null);
    try {
      const yn = year.trim() ? Number(year.trim()) : undefined;
      const body: TraditionalSearchRequest = {
        q: q || undefined,
        author: author || undefined,
        year: yn && Number.isFinite(yn) ? yn : undefined,
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
      setErr(e instanceof HttpError ? e.message : String(e));
      setResp(null);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(1);
  }

  const scoreMax = useMemo(
    () => (resp?.hits ?? []).reduce((m, h) => Math.max(m, h.score), 1),
    [resp],
  );
  const total = resp?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* filters */}
      <aside className="col-span-12 md:col-span-4 lg:col-span-3">
        <form onSubmit={onSubmit} className="term-panel p-4 space-y-3 md:sticky md:top-6">
          <div className="kicker">filters · 检索条件</div>
          <Field label="query · 关键词" value={q} set={setQ} placeholder="任意词" />
          <Field label="author · 作者" value={author} set={setAuthor} />
          <Field label="year · 年份" value={year} set={setYear} mono placeholder="2024" />
          <Field label="journal · 刊名" value={journal} set={setJournal} />
          <Field label="keywords · 关键词组" value={keywords} set={setKeywords} placeholder="逗号/空格分隔" />
          <div>
            <div className="kicker mb-1.5">sort · 排序</div>
            <div className="flex gap-2">
              {(["relevance", "year"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSort(s)}
                  className={`chip ${sort === s ? "chip-cyan" : ""}`}
                >
                  {s === "relevance" ? "相关性" : "年份"}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-term btn-primary w-full justify-center" disabled={loading}>
            {loading ? "searching…" : "▸ 检索"}
          </button>
        </form>
      </aside>

      {/* results */}
      <section className="col-span-12 md:col-span-8 lg:col-span-9">
        <SectionTitle
          right={
            resp ? (
              <span className="mono text-xs text-text-3 tnum">
                {total} hits · p{page}/{totalPages}
              </span>
            ) : null
          }
        >
          results · 检索结果
        </SectionTitle>
        {loading && <Loading label="SEARCHING" />}
        {err && <ErrorBox msg={err} />}
        {!loading && !err && !resp && (
          <Empty text="填入条件后点击「检索」" />
        )}
        {resp && resp.hits.length === 0 && !loading && <Empty text="无结果 · no hits" />}
        {resp && resp.hits.length > 0 && (
          <div className="space-y-2 stagger">
            {resp.hits.map((h, i) => (
              <ResultRow
                key={h.paper_id + i}
                hit={h}
                index={(page - 1) * pageSize + i + 1}
                scoreMax={scoreMax}
              />
            ))}
          </div>
        )}
        {resp && totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button className="btn-term" disabled={page <= 1 || loading} onClick={() => run(page - 1)}>
              ← prev
            </button>
            <span className="mono text-xs tnum text-text-2">
              {String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
            </span>
            <button className="btn-term" disabled={page >= totalPages || loading} onClick={() => run(page + 1)}>
              next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* ----------------------- AI 增强检索 ----------------------- */

function Smart() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resp, setResp] = useState<SmartSearchResponse | null>(null);
  const [list, setList] = useState<"golden" | "bm25" | "vector">("golden");

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      setResp(await api.searchSmart({ q: q.trim() }));
    } catch (e2) {
      setErr(e2 instanceof HttpError ? e2.message : String(e2));
      setResp(null);
    } finally {
      setLoading(false);
    }
  }

  const hits: Hit[] =
    resp == null
      ? []
      : list === "golden"
        ? resp.golden
        : list === "bm25"
          ? resp.list_bm25
          : resp.list_vector;
  const scoreMax = useMemo(() => hits.reduce((m, h) => Math.max(m, h.score), 0.0001), [hits]);
  const payload = resp?.rewrite?.search_payload;

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="term-panel p-4">
        <div className="kicker mb-2">prompt · 自然语言研究问题</div>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          placeholder="例如：数字时代文化传播的异化与超越"
          className="input-term resize-y font-sans"
        />
        <div className="mt-3 flex items-center gap-3">
          <button type="submit" className="btn-term btn-primary" disabled={loading || !q.trim()}>
            {loading ? "analyzing…" : "▸ 智能检索"}
          </button>
          <span className="mono text-[11px] text-text-3">rewrite → BM25 ∪ vector → RRF</span>
        </div>
      </form>

      {loading && <Loading label="REWRITING & RETRIEVING" />}
      {err && <ErrorBox msg={err} />}

      {resp && payload && (
        <div className="term-panel p-4">
          <div className="kicker mb-3">query rewrite · 查询包</div>
          {payload.core_semantic_sentence && (
            <p className="text-sm text-text mb-3">
              <span className="chip chip-cyan mr-2">core</span>
              {payload.core_semantic_sentence}
            </p>
          )}
          <RewriteRow label="academic" tone="amber" words={payload.academic_keywords} />
          <RewriteRow label="synonyms" tone="default" words={payload.synonyms_and_extensions} />
          <RewriteRow label="variables" tone="default" words={payload.potential_variables} />
          <RewriteRow label="design" tone="violet" words={payload.research_design_terms} />
        </div>
      )}

      {resp && (
        <div>
          <div className="flex gap-1 border-b border-line mb-3">
            {([
              ["golden", `综合榜 ${resp.golden.length}`],
              ["bm25", `关键词 ${resp.list_bm25.length}`],
              ["vector", `语义 ${resp.list_vector.length}`],
            ] as const).map(([k, lbl]) => (
              <button
                key={k}
                className={`tab-term ${list === k ? "tab-active" : ""}`}
                onClick={() => setList(k)}
              >
                {lbl}
              </button>
            ))}
          </div>
          {hits.length === 0 ? (
            <Empty text={list === "vector" ? "语义榜为空（确认向量已嵌入）" : "本榜单无结果"} />
          ) : (
            <div className="space-y-2 stagger">
              {hits.map((h, i) => (
                <ResultRow key={h.paper_id + i} hit={h} index={i + 1} scoreMax={scoreMax} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RewriteRow({
  label,
  words,
  tone,
}: {
  label: string;
  words: string[];
  tone: "amber" | "violet" | "default";
}) {
  if (!words?.length) return null;
  const cls = tone === "amber" ? "chip-amber" : tone === "violet" ? "chip-violet" : "";
  return (
    <div className="flex items-start gap-3 py-1.5 border-t border-line first:border-t-0">
      <span className="kicker w-20 shrink-0 pt-1">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {words.map((w) => (
          <span key={w} className={`chip ${cls}`}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------- shared ----------------------- */

function Field({
  label,
  value,
  set,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="kicker">{label}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className={`input-term mt-1 ${mono ? "mono tnum" : ""}`}
      />
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="term-panel py-12 text-center text-text-3 text-sm italic">— {text} —</div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="term-panel border-red px-4 py-3 mono text-sm text-red" style={{ borderColor: "var(--red)" }}>
      ERROR · {msg}
    </div>
  );
}
