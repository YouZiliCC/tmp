import type {
  AnalyzeGenerateRequest,
  AnalyzeGenerateResponse,
  AnalyzeRunRequest,
  AnalyzeRunResponse,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  HistoryItem,
  MindmapResponse,
  Paper,
  Chunk,
  QaRequest,
  QaResponse,
  RelatedResponse,
  ReviewAutoRequest,
  ReviewManualRequest,
  ReviewResponse,
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

  // ---------------- T4 ----------------
  qaAnswer: (req: QaRequest) => post<QaResponse>("/qa/answer", req),

  // ---------------- T3 ----------------
  reviewAuto: (req: ReviewAutoRequest) =>
    post<ReviewResponse>("/review/auto", req),
  reviewManual: (req: ReviewManualRequest) =>
    post<ReviewResponse>("/review/manual", req),

  // ---------------- T5 ----------------
  paperChat: (id: string, req: ChatRequest) =>
    post<ChatResponse>(`/papers/${encodeURIComponent(id)}/chat`, req),
  paperSummary: (id: string) =>
    post<SummaryResponse>(`/papers/${encodeURIComponent(id)}/summary`, {}),
  paperMindmap: (id: string) =>
    post<MindmapResponse>(`/papers/${encodeURIComponent(id)}/mindmap`, {}),
  paperRelated: (id: string) =>
    post<RelatedResponse>(`/papers/${encodeURIComponent(id)}/related`, {}),
};

export { HttpError };
