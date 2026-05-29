import { useEffect, useId, useRef, useState } from "react";

interface Props {
  code: string;
}

/** Renders mermaid mindmap code into SVG with a dark theme; falls back to raw code on error. */
export default function Mindmap({ code }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            background: "#11151f",
            primaryColor: "#161b26",
            primaryBorderColor: "#4ecdc4",
            primaryTextColor: "#e4e7ec",
            lineColor: "#5c6675",
            fontFamily: "Sora, Noto Sans SC, sans-serif",
          },
        });
        const clean = code.replace(/^```(?:mermaid)?\s*/i, "").replace(/```$/i, "").trim();
        const { svg } = await mermaid.render(`mm-${rawId}`, clean);
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, rawId]);

  if (failed) {
    return (
      <pre className="md text-xs overflow-x-auto border border-line-2 rounded-sm p-3 bg-bg">
        <code>{code}</code>
      </pre>
    );
  }
  return <div ref={hostRef} className="mermaid-host overflow-x-auto" />;
}
