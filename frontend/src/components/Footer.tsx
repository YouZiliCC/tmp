import { dateLine } from "../lib/format";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink">
      <div className="max-w-column mx-auto px-6 py-6 grid grid-cols-3 items-center text-[0.7rem] font-mono tracking-[0.16em] uppercase text-ink-3">
        <div>set in Fraunces · Newsreader · Noto Serif SC</div>
        <div className="text-center">© XCJ Editorial Office</div>
        <div className="text-right tnum">{dateLine()}</div>
      </div>
    </footer>
  );
}
