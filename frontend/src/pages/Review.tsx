import { FormEvent, useState } from "react";
import { api, HttpError, StreamHandlers } from "../api/client";
import type { Citation, ReviewManualRequest, ReviewMatched, ReviewMeta } from "../api/types";
import SectionTitle from "../components/SectionTitle";
import Loading from "../components/Loading";
import Markdown from "../components/Markdown";
import CitationList from "../components/CitationList";

type Tab = "auto" | "manual";

export default function Review() {
  const [tab, setTab] = useState<Tab>("auto");
  return (
    <div className="space-y-6">
      <div>
        <div className="kicker mb-3">// synthesis</div>
        <h1 className="font-display font-bold text-2xl">文献综述</h1>
        <p className="mt-2 text-text-2 text-sm max-w-2xl leading-relaxed">
          自动综述：输入主题，系统检索并自选 Top5 文献生成综述。自选文献综述：用 DOI/标题精确定位库内单篇，或粘贴正文并补全题录信息（标题/作者/DOI）以便规范引用。
        </p>
      </div>
      <div className="flex gap-1 border-b border-line">
        <button className={`tab-term ${tab === "auto" ? "tab-active" : ""}`} onClick={() => setTab("auto")}>
          自动综述 · auto
        </button>
        <button className={`tab-term ${tab === "manual" ? "tab-active" : ""}`} onClick={() => setTab("manual")}>
          自选文献综述 · manual
        </button>
      </div>
      {tab === "auto" ? <Auto /> : <Manual />}
    </div>
  );
}

/** 流式综述状态：累积正文 + meta（引用/命中）。 */
function useReviewStream() {
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [matched, setMatched] = useState<ReviewMatched | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(fn: (h: StreamHandlers<ReviewMeta>) => Promise<void>) {
    setAnswer("");
    setCitations([]);
    setMatched(null);
    setErr(null);
    setLoading(true);
    setStreaming(true);
    try {
      await fn({
        onMeta: (m) => {
          setCitations(m.citations ?? []);
          setMatched(m.matched ?? null);
        },
        onDelta: (t) => {
          setLoading(false);
          setAnswer((a) => a + t);
        },
        onError: (msg) => setErr(msg),
      });
    } catch (e) {
      setErr(e instanceof HttpError ? e.message : String(e));
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  return { answer, citations, matched, loading, streaming, err, setErr, run };
}

type ReviewStream = ReturnType<typeof useReviewStream>;

function Auto() {
  const [q, setQ] = useState("");
  const s = useReviewStream();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    s.run((h) => api.reviewAutoStream({ q: q.trim() }, h));
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="term-panel p-4">
        <div className="kicker mb-2">topic · 综述主题</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例如：短视频与民族交往交流交融"
          className="input-term font-sans"
        />
        <button type="submit" className="btn-term btn-primary mt-3" disabled={s.streaming || !q.trim()}>
          {s.streaming ? "writing…" : "▸ 生成综述"}
        </button>
      </form>
      <ReviewResult s={s} loadingLabel="RETRIEVING & SYNTHESIZING" />
    </div>
  );
}

function Manual() {
  const [mode, setMode] = useState<"locate" | "text">("locate");
  const [doi, setDoi] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [journal, setJournal] = useState("");
  const s = useReviewStream();

  function onFile(f: File | undefined) {
    if (!f) return;
    if (!/\.(txt|md)$/i.test(f.name)) {
      s.setErr("仅支持 .txt/.md 直接读取；.docx 请粘贴正文文本");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(f);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "text") {
      if (!text.trim()) return s.setErr("请粘贴论文正文文本");
      if (!title.trim()) return s.setErr("请填写论文标题（用于生成规范引用）");
    } else if (!doi.trim() && !title.trim()) {
      return s.setErr("请填写 DOI 或标题");
    }
    const yn = year.trim() ? Number(year.trim()) : undefined;
    const body: ReviewManualRequest =
      mode === "text"
        ? {
            text: text.trim(),
            title: title.trim() || undefined,
            author: author.trim() || undefined,
            doi: doi.trim() || undefined,
            year: yn && Number.isFinite(yn) ? yn : undefined,
            journal: journal.trim() || undefined,
          }
        : { doi: doi.trim() || undefined, title: title.trim() || undefined };
    s.run((h) => api.reviewManualStream(body, h));
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="term-panel p-4 space-y-3">
        <div className="flex gap-2">
          <button type="button" className={`chip ${mode === "locate" ? "chip-cyan" : ""}`} onClick={() => setMode("locate")}>
            DOI / 标题精确定位
          </button>
          <button type="button" className={`chip ${mode === "text" ? "chip-cyan" : ""}`} onClick={() => setMode("text")}>
            粘贴 / 上传正文
          </button>
        </div>
        {mode === "locate" ? (
          <div className="space-y-3 fade-in">
            <label className="block">
              <span className="kicker">doi</span>
              <input value={doi} onChange={(e) => setDoi(e.target.value)} className="input-term mt-1 mono" placeholder="10.xxxx/xxxx" />
            </label>
            <label className="block">
              <span className="kicker">title · 标题（精确）</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-term mt-1" />
            </label>
          </div>
        ) : (
          <div className="space-y-2 fade-in">
            <div className="kicker">题录信息（用于规范引用，标题必填）</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block sm:col-span-2">
                <span className="kicker">title · 标题 *</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-term mt-1" placeholder="论文标题" />
              </label>
              <label className="block">
                <span className="kicker">author · 作者</span>
                <input value={author} onChange={(e) => setAuthor(e.target.value)} className="input-term mt-1" placeholder="张三, 李四" />
              </label>
              <label className="block">
                <span className="kicker">doi</span>
                <input value={doi} onChange={(e) => setDoi(e.target.value)} className="input-term mt-1 mono" placeholder="10.xxxx/xxxx" />
              </label>
              <label className="block">
                <span className="kicker">year · 年份</span>
                <input value={year} onChange={(e) => setYear(e.target.value)} className="input-term mt-1 mono tnum" placeholder="2024" />
              </label>
              <label className="block">
                <span className="kicker">journal · 刊名</span>
                <input value={journal} onChange={(e) => setJournal(e.target.value)} className="input-term mt-1" placeholder="期刊名" />
              </label>
            </div>
            <span className="kicker">full text · 正文文本</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="input-term resize-y font-sans" placeholder="粘贴论文正文…" />
            <input type="file" accept=".txt,.md" onChange={(e) => onFile(e.target.files?.[0])} className="block text-xs text-text-3 file:mr-3 file:border file:border-line-2 file:bg-bg-2 file:text-text-2 file:px-2 file:py-1 file:rounded-sm file:mono" />
          </div>
        )}
        <button type="submit" className="btn-term btn-primary" disabled={s.streaming}>
          {s.streaming ? "writing…" : "▸ 生成综述"}
        </button>
      </form>
      <ReviewResult s={s} loadingLabel="LOCATING & SYNTHESIZING" />
    </div>
  );
}

function ReviewResult({ s, loadingLabel }: { s: ReviewStream; loadingLabel: string }) {
  const { answer, citations, matched, loading, streaming, err } = s;
  return (
    <>
      {loading && <Loading label={loadingLabel} />}
      {err && (
        <div className="term-panel px-4 py-3 mono text-sm text-red" style={{ borderColor: "var(--red)" }}>
          ERROR · {err}
        </div>
      )}
      {(answer || (streaming && !loading)) && (
        <>
          {matched && <div className="kicker text-cyan">▸ matched: {matched.title}</div>}
          <section>
            <SectionTitle>review · 综述正文</SectionTitle>
            <div className="term-panel p-5">
              <Markdown source={answer} />
              {streaming && <span className="animate-pulse text-cyan">▍</span>}
            </div>
          </section>
          {citations.length > 0 && (
            <section>
              <SectionTitle>citations · 引用文献</SectionTitle>
              <CitationList citations={citations} />
            </section>
          )}
        </>
      )}
    </>
  );
}
