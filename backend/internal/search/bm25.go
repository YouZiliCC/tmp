package search

import (
	"math"
	"sort"
	"strings"

	"xcjdev/backend/internal/store"
)

// FieldWeights 对应 3.md 中给出的字段权重。
type FieldWeights struct {
	Title          float64
	Keywords       float64
	Abstract       float64
	ResearchDesign float64
	Body           float64
}

func DefaultFieldWeights() FieldWeights {
	return FieldWeights{
		Title:          8.0,
		Keywords:       5.0,
		Abstract:       3.0,
		ResearchDesign: 4.0,
		Body:           1.0,
	}
}

type fieldStats struct {
	avgDL float64
	docDF map[string]int
}

// Index 存储 BM25 所需的统计量与每篇论文的 token 列表。
type Index struct {
	papers      []store.Paper
	tokens      [][5][]string // 5 = title/keywords/abstract/research_design/body
	docLen      [][5]int
	fieldStats  [5]fieldStats
	docCount    int
	idx         map[string]int // paper_id -> index
	allowedMask []bool
}

const (
	fTitle    = 0
	fKeywords = 1
	fAbstract = 2
	fDesign   = 3
	fBody     = 4
)

// Build 构造 BM25 索引；token 字段直接来自存储层。
func Build(papers []store.Paper) *Index {
	idx := &Index{
		papers:   papers,
		tokens:   make([][5][]string, len(papers)),
		docLen:   make([][5]int, len(papers)),
		docCount: len(papers),
		idx:      make(map[string]int, len(papers)),
	}
	for i := range idx.fieldStats {
		idx.fieldStats[i].docDF = map[string]int{}
	}
	var fieldTotal [5]int
	for i, p := range papers {
		idx.idx[p.PaperID] = i
		idx.tokens[i][fTitle] = SplitTokens(p.TitleTokens)
		idx.tokens[i][fKeywords] = SplitTokens(p.KeywordsTokens)
		idx.tokens[i][fAbstract] = SplitTokens(p.AbstractTokens)
		idx.tokens[i][fDesign] = SplitTokens(p.ResearchDesignTokens)
		idx.tokens[i][fBody] = SplitTokens(p.BodyTokens)
		for f := 0; f < 5; f++ {
			idx.docLen[i][f] = len(idx.tokens[i][f])
			fieldTotal[f] += len(idx.tokens[i][f])
			seen := map[string]bool{}
			for _, t := range idx.tokens[i][f] {
				if !seen[t] {
					idx.fieldStats[f].docDF[t]++
					seen[t] = true
				}
			}
		}
	}
	if idx.docCount > 0 {
		for f := 0; f < 5; f++ {
			idx.fieldStats[f].avgDL = float64(fieldTotal[f]) / float64(idx.docCount)
		}
	}
	return idx
}

// Hit 是一篇文献的命中结果。
type Hit struct {
	PaperID       string   `json:"paper_id"`
	Score         float64  `json:"score"`
	MatchedFields []string `json:"matched_fields"`
	Rank          int      `json:"rank"`
}

// SetAllowed 应用白名单（来自结构化过滤）。
func (idx *Index) SetAllowed(allowed []string) {
	if len(allowed) == 0 {
		idx.allowedMask = nil
		return
	}
	idx.allowedMask = make([]bool, idx.docCount)
	for _, id := range allowed {
		if pos, ok := idx.idx[id]; ok {
			idx.allowedMask[pos] = true
		}
	}
}

// QueryBM25 在所有字段上加权打分。返回降序排列的 Hit 列表。
func (idx *Index) QueryBM25(query []string, w FieldWeights, topK int) []Hit {
	if len(query) == 0 || idx.docCount == 0 {
		return nil
	}
	const k1, b = 1.5, 0.75
	weights := [5]float64{w.Title, w.Keywords, w.Abstract, w.ResearchDesign, w.Body}
	scores := make([]float64, idx.docCount)
	matchedFlag := make([][5]bool, idx.docCount)
	uniq := uniqueTokens(query)
	for f := 0; f < 5; f++ {
		stats := idx.fieldStats[f]
		if stats.avgDL == 0 {
			continue
		}
		for _, t := range uniq {
			df := stats.docDF[t]
			if df == 0 {
				continue
			}
			idf := math.Log(1 + (float64(idx.docCount)-float64(df)+0.5)/(float64(df)+0.5))
			for i := 0; i < idx.docCount; i++ {
				if idx.allowedMask != nil && !idx.allowedMask[i] {
					continue
				}
				toks := idx.tokens[i][f]
				if len(toks) == 0 {
					continue
				}
				tf := countTerm(toks, t)
				if tf == 0 {
					continue
				}
				dl := float64(len(toks))
				norm := tf * (k1 + 1) / (tf + k1*(1-b+b*dl/stats.avgDL))
				scores[i] += weights[f] * idf * norm
				matchedFlag[i][f] = true
			}
		}
	}
	hits := make([]Hit, 0, 64)
	fieldNames := [5]string{"title", "keywords", "abstract", "research_design", "body"}
	for i, s := range scores {
		if s <= 0 {
			continue
		}
		// 标题不命中则做强降权
		if !matchedFlag[i][fTitle] {
			s *= 0.7
		}
		var fields []string
		for f := 0; f < 5; f++ {
			if matchedFlag[i][f] {
				fields = append(fields, fieldNames[f])
			}
		}
		hits = append(hits, Hit{
			PaperID:       idx.papers[i].PaperID,
			Score:         s,
			MatchedFields: fields,
		})
	}
	sort.Slice(hits, func(i, j int) bool { return hits[i].Score > hits[j].Score })
	if topK > 0 && len(hits) > topK {
		hits = hits[:topK]
	}
	for i := range hits {
		hits[i].Rank = i + 1
	}
	return hits
}

func uniqueTokens(in []string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(in))
	for _, t := range in {
		if t = strings.TrimSpace(t); t == "" {
			continue
		}
		if _, ok := seen[t]; ok {
			continue
		}
		seen[t] = struct{}{}
		out = append(out, t)
	}
	return out
}

func countTerm(tokens []string, t string) float64 {
	var n float64
	for _, x := range tokens {
		if x == t {
			n++
		}
	}
	return n
}
