import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="mono text-cyan text-sm tracking-widest">404 · NOT FOUND IN ARCHIVE</div>
      <div className="mt-4 font-display font-bold text-3xl">
        页面不存在<span className="cursor-blink" />
      </div>
      <Link to="/" className="mt-6 inline-block kicker text-cyan hover:text-text transition-colors">
        ▸ 返回控制台
      </Link>
    </div>
  );
}
