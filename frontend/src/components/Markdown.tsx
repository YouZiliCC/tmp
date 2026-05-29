import { useMemo } from "react";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

interface Props {
  source: string;
  className?: string;
}

/** Lightweight markdown renderer with dark prose styling. */
export default function Markdown({ source, className }: Props) {
  const html = useMemo(() => {
    try {
      return marked.parse(source ?? "", { async: false }) as string;
    } catch {
      return (source ?? "").replace(/</g, "&lt;");
    }
  }, [source]);

  return (
    <div
      className={`md ${className ?? ""}`}
      // marked output; source is trusted backend LLM text
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
