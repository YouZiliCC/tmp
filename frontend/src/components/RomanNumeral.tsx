import { toRoman } from "../lib/format";

interface RomanNumeralProps {
  n: number;
  size?: "md" | "lg" | "xl";
  className?: string;
}

const SIZE: Record<NonNullable<RomanNumeralProps["size"]>, string> = {
  md: "2rem",
  lg: "4rem",
  xl: "6rem",
};

export default function RomanNumeral({
  n,
  size = "xl",
  className = "",
}: RomanNumeralProps) {
  return (
    <span
      className={`ordinal ${className}`}
      style={{ fontSize: SIZE[size] }}
      aria-label={`卷 ${n}`}
    >
      {toRoman(n)}
    </span>
  );
}
