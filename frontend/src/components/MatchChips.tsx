interface Props {
  /** matched_fields[] from Hit, or matched_by string from References/Related */
  fields?: string[];
  matchedBy?: string;
}

const SEMANTIC = ["语义", "vector", "向量", "semantic"];
const KEYWORD = ["关键词", "bm25", "keyword", "title", "标题", "author", "作者", "abstract", "摘要"];

function tone(label: string): "violet" | "amber" | "cyan" {
  const l = label.toLowerCase();
  if (SEMANTIC.some((s) => l.includes(s.toLowerCase()))) return "violet";
  if (KEYWORD.some((s) => l.includes(s.toLowerCase()))) return "amber";
  return "cyan";
}

/** Render hit-source chips: semantic=violet border, keyword=amber border. */
export default function MatchChips({ fields, matchedBy }: Props) {
  let labels: string[] = [];
  if (fields && fields.length) labels = fields;
  else if (matchedBy) labels = matchedBy.split(/[+＋,，/]/).map((s) => s.trim()).filter(Boolean);
  if (!labels.length) return null;

  return (
    <span className="inline-flex flex-wrap gap-1">
      {labels.map((f, i) => {
        const t = tone(f);
        return (
          <span
            key={`${f}-${i}`}
            className={`chip ${t === "violet" ? "chip-violet" : t === "amber" ? "chip-amber" : "chip-cyan"}`}
          >
            {f}
          </span>
        );
      })}
    </span>
  );
}
