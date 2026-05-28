import { normScore } from "../lib/format";

interface ScoreBarProps {
  score: number;
  max?: number;
  /** rendered width of bar in px */
  width?: number;
  showNumber?: boolean;
  className?: string;
}

export default function ScoreBar({
  score,
  max = 1,
  width = 120,
  showNumber = true,
  className = "",
}: ScoreBarProps) {
  const ratio = normScore(score, max);
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="score-rail" style={{ width }}>
        <div className="score-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      {showNumber && (
        <span className="font-mono text-[0.78rem] tnum text-ink-2">
          {score.toFixed(3)}
        </span>
      )}
    </div>
  );
}
