import { padOrdinal } from "../lib/format";

interface OrdinalNumberProps {
  n: number;
  size?: "sm" | "md" | "lg" | "xl";
  width?: number;
  className?: string;
}

const SIZE: Record<NonNullable<OrdinalNumberProps["size"]>, string> = {
  sm: "1.25rem",
  md: "1.75rem",
  lg: "2.6rem",
  xl: "4.2rem",
};

export default function OrdinalNumber({
  n,
  size = "md",
  width = 2,
  className = "",
}: OrdinalNumberProps) {
  return (
    <span
      className={`ordinal ${className}`}
      style={{ fontSize: SIZE[size] }}
      aria-label={`序号 ${n}`}
    >
      {padOrdinal(n, width)}
    </span>
  );
}
