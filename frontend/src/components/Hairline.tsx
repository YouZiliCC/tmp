import type { ReactNode, CSSProperties } from "react";

interface HairlineProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/** Wrapper that draws 1px rule lines on the requested sides. */
export default function Hairline({
  children,
  className = "",
  style,
  top,
  bottom,
  left,
  right,
}: HairlineProps) {
  const border: CSSProperties = {
    borderTop: top ? "1px solid var(--rule)" : undefined,
    borderBottom: bottom ? "1px solid var(--rule)" : undefined,
    borderLeft: left ? "1px solid var(--rule)" : undefined,
    borderRight: right ? "1px solid var(--rule)" : undefined,
  };
  return (
    <div className={className} style={{ ...border, ...style }}>
      {children}
    </div>
  );
}
