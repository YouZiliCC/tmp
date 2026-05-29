import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  right?: ReactNode;
}

/** mono uppercase section heading with 2px cyan bar. */
export default function SectionTitle({ children, right }: Props) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="section-title">{children}</h2>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
