import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  limit?: number;
  className?: string;
}

export default function ExpandableText({
  text,
  limit = 180,
  className = "",
}: ExpandableTextProps) {
  const [open, setOpen] = useState(false);
  const safe = text ?? "";
  const long = safe.length > limit;
  const shown = open || !long ? safe : safe.slice(0, limit) + "…";

  return (
    <div className={className}>
      <p className="font-serif text-[0.95rem] leading-[1.7] text-ink-2">
        {shown}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="font-mono text-[0.72rem] tracking-wider text-ink-3 mt-1 hover:text-ink hover:underline underline-offset-2"
        >
          {open ? "− 收起" : "+ 展开"}
        </button>
      )}
    </div>
  );
}
