package pyclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	BaseURL string
	HTTP    *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		BaseURL: strings.TrimRight(baseURL, "/"),
		HTTP:    &http.Client{Timeout: 5 * time.Minute},
	}
}

func (c *Client) postJSON(ctx context.Context, path string, payload any, out any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal %s: %w", path, err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+path, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build request %s: %w", path, err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return fmt.Errorf("call %s: %w", path, err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		preview := string(raw)
		if len(preview) > 200 {
			preview = preview[:200]
		}
		return fmt.Errorf("py %s status=%d body=%s", path, resp.StatusCode, preview)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(raw, out); err != nil {
		preview := string(raw)
		if len(preview) > 200 {
			preview = preview[:200]
		}
		return fmt.Errorf("decode %s: %w body=%s", path, err, preview)
	}
	return nil
}

// Embed 调用 Python 服务获取嵌入向量。
func (c *Client) Embed(ctx context.Context, texts []string) ([][]float32, error) {
	req := map[string]any{"texts": texts}
	var resp struct {
		Vectors [][]float32 `json:"vectors"`
	}
	if err := c.postJSON(ctx, "/embed", req, &resp); err != nil {
		return nil, err
	}
	return resp.Vectors, nil
}

type RewriteResult struct {
	FilterConditions map[string]any `json:"filter_conditions"`
	SearchPayload    struct {
		CoreSemanticSentence  string   `json:"core_semantic_sentence"`
		AcademicKeywords      []string `json:"academic_keywords"`
		SynonymsAndExtensions []string `json:"synonyms_and_extensions"`
		PotentialVariables    []string `json:"potential_variables"`
		ResearchDesignTerms   []string `json:"research_design_terms"`
	} `json:"search_payload"`
}

// Rewrite 让 LLM 拆解查询。
func (c *Client) Rewrite(ctx context.Context, query string) (*RewriteResult, error) {
	req := map[string]any{"q": query}
	var resp RewriteResult
	if err := c.postJSON(ctx, "/rewrite", req, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

type GeneratePaper struct {
	PaperID            string  `json:"paper_id"`
	Title              string  `json:"title"`
	DOI                string  `json:"doi"`
	Author             string  `json:"author"`
	Keywords           string  `json:"keywords"`
	Abstract           string  `json:"abstract"`
	PublishYear        int     `json:"publish_year"`
	ResearchDesignText string  `json:"research_design_text"`
	TopChunkText       string  `json:"top_chunk_text"`
	RelevanceScore     float64 `json:"relevance_score"`
}

type GenerateRequest struct {
	Query  string          `json:"query"`
	Papers []GeneratePaper `json:"papers"`
}

type GenerateResponse struct {
	Answer    string           `json:"answer"`
	Citations []map[string]any `json:"citations"`
}

// Generate 让 LLM 基于检索到的论文生成综述答案。
func (c *Client) Generate(ctx context.Context, req GenerateRequest) (*GenerateResponse, error) {
	var resp GenerateResponse
	if err := c.postJSON(ctx, "/generate", req, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// Analyze 通用分析入口。
func (c *Client) Analyze(ctx context.Context, kind string, params map[string]any) (map[string]any, error) {
	req := map[string]any{"kind": kind, "params": params}
	var resp map[string]any
	if err := c.postJSON(ctx, "/analyze", req, &resp); err != nil {
		return nil, err
	}
	return resp, nil
}
