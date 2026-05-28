package search

import "sort"

// RRF 倒数排名融合。k 默认 60；topK<=0 表示不截断。
func RRF(listA, listB []Hit, k int, topK int) []Hit {
	if k <= 0 {
		k = 60
	}
	type agg struct {
		score   float64
		fields  map[string]struct{}
		paperID string
	}
	m := make(map[string]*agg)
	add := func(list []Hit) {
		for _, h := range list {
			rank := h.Rank
			if rank <= 0 {
				continue
			}
			a, ok := m[h.PaperID]
			if !ok {
				a = &agg{fields: map[string]struct{}{}, paperID: h.PaperID}
				m[h.PaperID] = a
			}
			a.score += 1.0 / float64(k+rank)
			for _, f := range h.MatchedFields {
				a.fields[f] = struct{}{}
			}
		}
	}
	add(listA)
	add(listB)
	out := make([]Hit, 0, len(m))
	for _, a := range m {
		fields := make([]string, 0, len(a.fields))
		for f := range a.fields {
			fields = append(fields, f)
		}
		sort.Strings(fields)
		out = append(out, Hit{
			PaperID:       a.paperID,
			Score:         a.score,
			MatchedFields: fields,
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Score > out[j].Score })
	if topK > 0 && len(out) > topK {
		out = out[:topK]
	}
	for i := range out {
		out[i].Rank = i + 1
	}
	return out
}
