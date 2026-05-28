package search

import (
	"strings"
	"unicode"
)

// Tokenize 输入字符串得到 token 列表。规则：
//   - ASCII 字母数字串作为整词（小写化）
//   - 中文字符按字符级与相邻 bigram 同时入索引
//   - 标点/空白视为分隔
//
// 这套规则不依赖外部分词器但足以支撑相关性排序与字段加权。
func Tokenize(s string) []string {
	if s == "" {
		return nil
	}
	var (
		out      []string
		asciiBuf strings.Builder
		hanBuf   []rune
	)
	flushAscii := func() {
		if asciiBuf.Len() > 0 {
			out = append(out, strings.ToLower(asciiBuf.String()))
			asciiBuf.Reset()
		}
	}
	flushHan := func() {
		for i, r := range hanBuf {
			out = append(out, string(r))
			if i+1 < len(hanBuf) {
				out = append(out, string([]rune{hanBuf[i], hanBuf[i+1]}))
			}
		}
		hanBuf = hanBuf[:0]
	}
	for _, r := range s {
		switch {
		case (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9'):
			flushHan()
			asciiBuf.WriteRune(r)
		case unicode.Is(unicode.Han, r):
			flushAscii()
			hanBuf = append(hanBuf, r)
		default:
			flushAscii()
			flushHan()
		}
	}
	flushAscii()
	flushHan()
	return out
}

// TokenizeJoin 用空格连接 token 列表，便于直接存入 DB。
func TokenizeJoin(s string) string {
	return strings.Join(Tokenize(s), " ")
}

// SplitTokens 把空格连接的 token 还原为切片。
func SplitTokens(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Fields(s)
	return parts
}
