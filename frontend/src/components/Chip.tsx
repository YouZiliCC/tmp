import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  tone?: "default" | "accent" | "copper";
  className?: string;
  title?: string;
}

export default function Chip({
  children,
  tone = "default",
  className = "",
  title,
}: ChipProps) {
  const toneCls =
    tone === "accent"
      ? "chip--accent"
      : tone === "copper"
      ? "chip--copper"
      : "";
  return (
    <span className={`chip ${toneCls} ${className}`} title={title}>
      {children}
    </span>
  );
}
