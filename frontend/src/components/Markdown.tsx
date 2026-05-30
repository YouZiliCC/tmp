import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  source: string;
  className?: string;
}

/**
 * 统一 Markdown 渲染器：react-markdown + GFM。
 * 默认不渲染原始 HTML（安全），对流式中半截的 markdown 也能稳定容错渲染。
 * 暗色排版样式由 `.md` 类（index.css）提供。
 */
export default function Markdown({ source, className }: Props) {
  return (
    <div className={`md ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source ?? ""}</ReactMarkdown>
    </div>
  );
}
