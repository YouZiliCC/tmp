import type { ReactNode } from "react";

interface KickerProps {
  children: ReactNode;
  block?: boolean;
  className?: string;
}

/** Section kicker — uppercase, hairline above, --ink-3 */
export default function Kicker({ children, block, className = "" }: KickerProps) {
  return (
    <span className={`kicker ${block ? "kicker--block" : ""} ${className}`}>
      {children}
    </span>
  );
}
