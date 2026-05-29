interface Props {
  label?: string;
}

/** Terminal-style loading indicator with scanning bar + animated dots. */
export default function Loading({ label = "PROCESSING" }: Props) {
  return (
    <div className="term-panel scan-bar px-4 py-6 flex items-center gap-3">
      <span className="text-cyan mono text-sm">▸</span>
      <span className="kicker text-text-2">{label}</span>
      <span className="dots-loading mono text-cyan text-sm" />
    </div>
  );
}
