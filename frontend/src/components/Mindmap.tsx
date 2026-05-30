import { useEffect, useRef } from "react";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";

interface Props {
  /** markmap 大纲（Markdown：一级标题为根，二级标题为主分支，- 列表为要点）。 */
  markdown: string;
}

const transformer = new Transformer();

/** 用 markmap 把 Markdown 大纲渲染为可展开/收起的真·思维导图（暗色）。 */
export default function Mindmap({ markdown }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mmRef = useRef<Markmap | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const { root } = transformer.transform(markdown?.trim() || "# 论文");
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--cyan").trim() || "#0d9488";
    if (!mmRef.current) {
      mmRef.current = Markmap.create(
        svgRef.current,
        {
          duration: 300,
          spacingVertical: 8,
          spacingHorizontal: 90,
          paddingX: 12,
          color: () => accent,
          fitRatio: 0.95,
        },
        root
      );
    } else {
      mmRef.current.setData(root);
      mmRef.current.fit();
    }
  }, [markdown]);

  useEffect(
    () => () => {
      mmRef.current?.destroy();
      mmRef.current = null;
    },
    []
  );

  return <svg ref={svgRef} className="markmap-svg w-full" style={{ height: 380 }} />;
}
