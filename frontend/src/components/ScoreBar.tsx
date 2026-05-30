interface Props {
  score: number;
  max?: number;
}

/**
 * 相关度强弱条（无数字）。
 * 原先会显示 score.toFixed(2) 的小数，用户反馈看不懂，已去掉数字仅保留可视化强弱。
 */
export default function ScoreBar({ score, max = 1 }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, score / max)) * 100 : 0;
  return (
    <div className="flex items-center gap-1.5 w-28 shrink-0" title="相关度">
      <span className="kicker text-text-3 shrink-0">相关度</span>
      <div className="flex-1 h-[3px] bg-bg-2 border border-line">
        <div
          className="h-full bg-cyan"
          style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(78,205,196,0.5)" }}
        />
      </div>
    </div>
  );
}
