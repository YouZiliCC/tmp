import type {
  AnalyzeGenerateRequest,
  AnalyzeGenerateResponse,
  AnalyzeRunRequest,
  AnalyzeRunResponse,
  ChatMeta,
  ChatRequest,
  HealthResponse,
  HistoryItem,
  MindmapResponse,
  Paper,
  Chunk,
  QaMeta,
  QaRequest,
  RelatedResponse,
  ReviewAutoRequest,
  ReviewManualRequest,
  ReviewMeta,
  SmartSearchRequest,
  SmartSearchResponse,
  StatsResponse,
  SummaryResponse,
  TraditionalSearchRequest,
  TraditionalSearchResponse,
} from "./types";

const BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

class HttpError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body.slice(0, 160)}`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | number | undefined> }
): Promise<T> {
  let url = `${BASE}${path}`;
  if (init?.query) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(init.query)) {
      if (v === undefined || v === null) continue;
      sp.append(k, String(v));
    }
    const qs = sp.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const text = await res.text();
  if (!res.ok) throw new HttpError(res.status, text);
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

const post = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

// ---------------- SSE 流式 ----------------
export interface StreamHandlers<M = unknown> {
  onMeta?: (meta: M) => void;
  onDelta?: (text: string) => void;
  onError?: (message: string) => void;
}

/** POST 并消费 SSE 流（event: meta|delta|error|done）。done/流结束后 resolve。 */
async function postStream<M>(
  path: string,
  body: unknown,
  h: StreamHandlers<M>,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status || 500, text || "stream failed");
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const dispatch = (chunk: string) => {
    let event = "message";
    let data = "";
    for (const line of chunk.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (!data) return;
    let parsed: unknown = data;
    try {
      parsed = JSON.parse(data);
    } catch {
      /* keep raw */
    }
    if (event === "meta") h.onMeta?.(parsed as M);
    else if (event === "delta")
      h.onDelta?.((parsed as { text?: string })?.text ?? "");
    else if (event === "error")
      h.onError?.((parsed as { message?: string })?.message ?? "stream error");
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let sep: number;
    while ((sep = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      dispatch(chunk);
    }
  }
  if (buf.trim()) dispatch(buf);
}

export const api = {
  health: () => request<HealthResponse>("/health"),
  stats: () => request<StatsResponse>("/stats"),

  searchTraditional: (req: TraditionalSearchRequest) =>
    post<TraditionalSearchResponse>("/search/traditional", req),

  searchSmart: (req: SmartSearchRequest) =>
    post<SmartSearchResponse>("/search/smart", req),

  analyzeGenerate: (req: AnalyzeGenerateRequest) =>
    post<AnalyzeGenerateResponse>("/analyze/generate", req),

  paper: (id: string) => request<Paper>(`/papers/${encodeURIComponent(id)}`),

  paperChunks: async (id: string, q?: string): Promise<Chunk[]> => {
    const res = await request<{ chunks: Chunk[] } | Chunk[]>(
      `/papers/${encodeURIComponent(id)}/chunks`,
      { query: { q } }
    );
    if (Array.isArray(res)) return res;
    return res?.chunks ?? [];
  },

  history: async (limit = 20): Promise<HistoryItem[]> => {
    const res = await request<{ history: HistoryItem[] } | HistoryItem[]>(
      "/history",
      { query: { limit } }
    );
    if (Array.isArray(res)) return res;
    return res?.history ?? [];
  },

  analyzeRun: (req: AnalyzeRunRequest) =>
    post<AnalyzeRunResponse>("/analyze/run", req),

  // ---------------- T4 · 智能问答（流式 SSE） ----------------
  qaAnswerStream: (req: QaRequest, h: StreamHandlers<QaMeta>, signal?: AbortSignal) =>
    postStream<QaMeta>("/qa/answer", req, h, signal),

  // ---------------- T3 · 文献综述（流式 SSE） ----------------
  reviewAutoStream: (
    req: ReviewAutoRequest,
    h: StreamHandlers<ReviewMeta>,
    signal?: AbortSignal
  ) => postStream<ReviewMeta>("/review/auto", req, h, signal),
  reviewManualStream: (
    req: ReviewManualRequest,
    h: StreamHandlers<ReviewMeta>,
    signal?: AbortSignal
  ) => postStream<ReviewMeta>("/review/manual", req, h, signal),

  // ---------------- T5 · 论文详情智能体 ----------------
  paperChatStream: (
    id: string,
    req: ChatRequest,
    h: StreamHandlers<ChatMeta>,
    signal?: AbortSignal
  ) => postStream<ChatMeta>(`/papers/${encodeURIComponent(id)}/chat`, req, h, signal),
  paperSummary: (id: string) =>
    post<SummaryResponse>(`/papers/${encodeURIComponent(id)}/summary`, {}),
  paperMindmap: (id: string) =>
    post<MindmapResponse>(`/papers/${encodeURIComponent(id)}/mindmap`, {}),
  paperRelated: (id: string) =>
    post<RelatedResponse>(`/papers/${encodeURIComponent(id)}/related`, {}),
};

export { HttpError };
