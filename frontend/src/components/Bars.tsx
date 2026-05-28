interface BarsProps {
  /** label -> count */
  data: Record<string, number>;
  height?: number;
  /** show count above bar */
  showCount?: boolean;
  className?: string;
}

/** Pure SVG hairline bar chart — no fill, only outline; year + count on top. */
export default function Bars({
  data,
  height = 180,
  showCount = true,
  className = "",
}: BarsProps) {
  const entries = Object.entries(data ?? {})
    .map(([k, v]) => [k, Number(v) || 0] as const)
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  if (entries.length === 0) {
    return (
      <div className={`font-mono text-[0.78rem] text-ink-3 ${className}`}>
        — no data —
      </div>
    );
  }

  const max = Math.max(...entries.map(([, v]) => v), 1);
  const W = 720;
  const H = height;
  const padX = 4;
  const padTop = 36;
  const padBottom = 28;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const slotW = innerW / entries.length;
  const barW = Math.max(6, slotW * 0.62);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ display: "block" }}
      >
        {/* baseline */}
        <line
          x1={padX}
          y1={H - padBottom}
          x2={W - padX}
          y2={H - padBottom}
          stroke="var(--ink)"
          strokeWidth={1}
        />
        {entries.map(([label, value], i) => {
          const h = (value / max) * innerH;
          const x = padX + i * slotW + (slotW - barW) / 2;
          const y = H - padBottom - h;
          return (
            <g key={label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={1}
              />
              {showCount && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                  fontSize={10}
                  fill="var(--ink-2)"
                >
                  {value}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={H - padBottom + 16}
                textAnchor="middle"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={10}
                fill="var(--ink-3)"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
