import type {
  AnalyzeGenerateRequest,
  AnalyzeGenerateResponse,
  AnalyzeRunRequest,
  AnalyzeRunResponse,
  HealthResponse,
  HistoryItem,
  Paper,
  Chunk,
  SmartSearchRequest,
  SmartSearchResponse,
  StatsResponse,
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

export const api = {
  health: () => request<HealthResponse>("/health"),
  stats: () => request<StatsResponse>("/stats"),

  searchTraditional: (req: TraditionalSearchRequest) =>
    request<TraditionalSearchResponse>("/search/traditional", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  searchSmart: (req: SmartSearchRequest) =>
    request<SmartSearchResponse>("/search/smart", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  analyzeGenerate: (req: AnalyzeGenerateRequest) =>
    request<AnalyzeGenerateResponse>("/analyze/generate", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  paper: (id: string) =>
    request<Paper>(`/papers/${encodeURIComponent(id)}`),

  paperChunks: async (id: string, q?: string): Promise<Chunk[]> => {
    const res = await request<{ chunks: Chunk[] } | Chunk[]>(
      `/papers/${encodeURIComponent(id)}/chunks`,
      { query: { q } },
    );
    if (Array.isArray(res)) return res;
    return res?.chunks ?? [];
  },

  history: async (limit = 20): Promise<HistoryItem[]> => {
    const res = await request<{ history: HistoryItem[] } | HistoryItem[]>(
      "/history",
      { query: { limit } },
    );
    if (Array.isArray(res)) return res;
    return res?.history ?? [];
  },

  analyzeRun: (req: AnalyzeRunRequest) =>
    request<AnalyzeRunResponse>("/analyze/run", {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

export { HttpError };
