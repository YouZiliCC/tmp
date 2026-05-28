-- 论文主表：MySQL/SQLite 通用结构
CREATE TABLE IF NOT EXISTS papers_master (
    paper_id             TEXT PRIMARY KEY,
    title                TEXT NOT NULL,
    doi                  TEXT,
    publish_year         INTEGER,
    author               TEXT,
    keywords             TEXT,
    abstract             TEXT,
    source_journal       TEXT,
    research_design_text TEXT,
    title_tokens         TEXT,
    keywords_tokens      TEXT,
    abstract_tokens      TEXT,
    research_design_tokens TEXT,
    body_tokens          TEXT,
    raw_body             TEXT
);

CREATE INDEX IF NOT EXISTS idx_papers_year   ON papers_master(publish_year);
CREATE INDEX IF NOT EXISTS idx_papers_author ON papers_master(author);
CREATE INDEX IF NOT EXISTS idx_papers_doi    ON papers_master(doi);

-- 文本切块（带向量）。向量存为 base64 编码的 float32 数组。
CREATE TABLE IF NOT EXISTS paper_chunks (
    chunk_id        TEXT PRIMARY KEY,
    paper_id        TEXT NOT NULL,
    chunk_index     INTEGER NOT NULL,
    paragraph_index INTEGER,
    offset_start    INTEGER,
    chunk_text      TEXT NOT NULL,
    embedding       BLOB
);

CREATE INDEX IF NOT EXISTS idx_chunks_paper ON paper_chunks(paper_id);

-- 检索历史
CREATE TABLE IF NOT EXISTS search_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mode        TEXT NOT NULL,
    query_text  TEXT,
    filters     TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
