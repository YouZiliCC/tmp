import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-32 text-center fade-up">
      <div className="font-mono text-[0.9rem] tracking-[0.22em] uppercase text-ink-2">
        404 · NOT FOUND IN ARCHIVE
      </div>
      <div
        className="font-display font-black text-ink-dark mt-8 tnum"
        style={{ fontSize: "7rem", lineHeight: 1, fontVariationSettings: '"opsz" 144' }}
      >
        404
      </div>
      <p className="mt-6 font-serif italic text-ink-3 max-w-md mx-auto">
        — 此页未收录于本卷。
        Perhaps it was filed in a future issue.
      </p>
      <div className="mt-10">
        <Link to="/" className="text-link">← 返回封面 · back to cover</Link>
      </div>
    </div>
  );
}
