import { FormEvent, useState } from "react";
import { api, HttpError } from "../api/client";
import type { ReviewResponse } from "../api/types";
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
          自动综述：输入主题，系统检索并自选 Top5 文献生成综述。自选文献综述：用 DOI/标题精确定位库内单篇，或直接粘贴正文文本。
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

function Auto() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resp, setResp] = useState<ReviewResponse | null>(null);

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      setResp(await api.reviewAuto({ q: q.trim() }));
    } catch (e2) {
      setErr(e2 instanceof HttpError ? e2.message : String(e2));
      setResp(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="term-panel p-4">
        <div className="kicker mb-2">topic · 综述主题</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例如：短视频与民族交往交流交融"
          className="input-term font-sans"
        />
        <button type="submit" className="btn-term btn-primary mt-3" disabled={loading || !q.trim()}>
          {loading ? "writing…" : "▸ 生成综述"}
        </button>
      </form>
      <ReviewResult loading={loading} err={err} resp={resp} loadingLabel="RETRIEVING & SYNTHESIZING" />
    </div>
  );
}

function Manual() {
  const [mode, setMode] = useState<"locate" | "text">("locate");
  const [doi, setDoi] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resp, setResp] = useState<ReviewResponse | null>(null);

  function onFile(f: File | undefined) {
    if (!f) return;
    if (!/\.(txt|md)$/i.test(f.name)) {
      setErr("仅支持 .txt/.md 直接读取；.docx 请粘贴正文文本");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(f);
  }

  async function run(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const body =
        mode === "text"
          ? { text: text.trim() }
          : { doi: doi.trim() || undefined, title: title.trim() || undefined };
      if (mode === "text" && !text.trim()) throw new Error("请粘贴正文文本");
      if (mode === "locate" && !doi.trim() && !title.trim()) throw new Error("请填写 DOI 或标题");
      setResp(await api.reviewManual(body));
    } catch (e2) {
      setErr(e2 instanceof HttpError ? e2.message : (e2 as Error).message);
      setResp(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="term-panel p-4 space-y-3">
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
            <span className="kicker">full text · 正文文本</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="input-term resize-y font-sans" placeholder="粘贴论文正文…" />
            <input type="file" accept=".txt,.md" onChange={(e) => onFile(e.target.files?.[0])} className="block text-xs text-text-3 file:mr-3 file:border file:border-line-2 file:bg-bg-2 file:text-text-2 file:px-2 file:py-1 file:rounded-sm file:mono" />
          </div>
        )}
        <button type="submit" className="btn-term btn-primary" disabled={loading}>
          {loading ? "writing…" : "▸ 生成综述"}
        </button>
      </form>
      <ReviewResult loading={loading} err={err} resp={resp} loadingLabel="LOCATING & SYNTHESIZING" />
    </div>
  );
}

function ReviewResult({
  loading,
  err,
  resp,
  loadingLabel,
}: {
  loading: boolean;
  err: string | null;
  resp: ReviewResponse | null;
  loadingLabel: string;
}) {
  return (
    <>
      {loading && <Loading label={loadingLabel} />}
      {err && (
        <div className="term-panel px-4 py-3 mono text-sm text-red" style={{ borderColor: "var(--red)" }}>
          ERROR · {err}
        </div>
      )}
      {resp && (
        <>
          {resp.matched && (
            <div className="kicker text-cyan">▸ matched: {resp.matched.title}</div>
          )}
          <section>
            <SectionTitle>review · 综述正文</SectionTitle>
            <div className="term-panel p-5">
              <Markdown source={resp.answer} />
            </div>
          </section>
          {resp.citations?.length > 0 && (
            <section>
              <SectionTitle>citations · 引用文献</SectionTitle>
              <CitationList citations={resp.citations} />
            </section>
          )}
        </>
      )}
    </>
  );
}
