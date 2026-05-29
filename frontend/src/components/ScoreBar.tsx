interface Props {
  score: number;
  max?: number;
}

/** Thin cyan score meter with mono numeric readout. */
export default function ScoreBar({ score, max = 1 }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, score / max)) * 100 : 0;
  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 h-[3px] bg-bg-2 border border-line">
        <div
          className="h-full bg-cyan"
          style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(78,205,196,0.5)" }}
        />
      </div>
      <span className="mono text-xs text-amber tnum w-10 text-right">
        {score.toFixed(2)}
      </span>
    </div>
  );
}
