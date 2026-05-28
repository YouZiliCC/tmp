// ============================================================
// API types — 对齐 backend handlers.go 实际 JSON 字段
// ============================================================

export interface HealthResponse {
  status: string;
}

export interface JournalCount {
  name: string;
  count: number;
}

export interface StatsResponse {
  paper_count: number;
  chunk_count: number;
  year_dist: Record<string, number>;
  top_journals: JournalCount[];
}

// ---------------- Search ----------------
export interface TraditionalSearchRequest {
  q?: string;
  author?: string;
  year?: number;
  journal?: string;
  keywords?: string;
  page?: number;
  page_size?: number;
  sort?: "relevance" | "year";
}

export interface Hit {
  paper_id: string;
  score: number;
  matched_fields: string[];
  rank: number;
  title: string;
  author: string;
  year: number;
  journal: string;
  abstract_preview: string;
  keywords: string;
}

export interface TraditionalSearchResponse {
  hits: Hit[];
  total: number;
}

// ---------------- Smart search ----------------
export interface FilterConditions {
  publish_year?: number | null;
  author?: string | null;
  journal?: string | null;
  [extra: string]: unknown;
}

export interface SearchPayload {
  core_semantic_sentence: string;
  academic_keywords: string[];
  synonyms_and_extensions: string[];
  potential_variables: string[];
  research_design_terms: string[];
}

export interface Rewrite {
  filter_conditions: FilterConditions;
  search_payload: SearchPayload;
}

export interface SmartSearchRequest {
  q: string;
}

export interface SmartSearchResponse {
  golden: Hit[];
  rewrite: Rewrite;
  list_bm25: Hit[];
  list_vector: Hit[];
}

// ---------------- Analyze ----------------
export interface AnalyzeGenerateRequest {
  q: string;
  paper_ids: string[];
}

export interface Citation {
  paper_id: string;
  title: string;
  doi?: string;
  author: string;
  keywords: string;
  abstract: string;
  publish_year: number;
  relevance_score: number;
  // 后端 handlers.go 用 top_chunk_text 字段。这里同时支持别名以防漂移
  top_chunk_text?: string;
  chunk_text?: string;
}

export interface AnalyzeGenerateResponse {
  answer: string;
  citations: Citation[];
}

// ---------------- Paper ----------------
export interface Chunk {
  chunk_id: string;
  chunk_index: number;
  paragraph_index: number;
  offset_start: number;
  chunk_text: string;
}

export interface Paper {
  paper_id: string;
  title: string;
  author: string;
  publish_year: number;
  source_journal: string;
  doi?: string;
  abstract: string;
  keywords: string;
  research_design_text?: string;
  chunks: Chunk[];
}

// ---------------- History ----------------
export interface HistoryItem {
  id: number;
  mode: string;
  query: string;
  filters: string;
  created_at: string;
}

// ---------------- Analyze run ----------------
export type AnalyzeKind =
  | "year"
  | "authors"
  | "keywords"
  | "journals"
  | "cooccurrence"
  | "tfidf";

export interface AnalyzeRunRequest {
  kind: AnalyzeKind;
  params?: Record<string, unknown>;
}

export interface AnalyzeRunResponse {
  data: unknown;
}
