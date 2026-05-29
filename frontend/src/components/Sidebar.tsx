import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api/client";

interface NavItem {
  to: string;
  label: string;
  en: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "RETRIEVAL · 检索",
    items: [
      { to: "/search", label: "文献检索", en: "search" },
      { to: "/qa", label: "智能问答", en: "qa" },
    ],
  },
  {
    title: "SYNTHESIS · 写作",
    items: [{ to: "/review", label: "文献综述", en: "review" }],
  },
  {
    title: "TOOLS · 工具",
    items: [{ to: "/help", label: "帮助说明", en: "help" }],
  },
];

/** Left terminal-style navigation rail with logo, groups, and live backend status. */
export default function Sidebar() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const ping = () =>
      api
        .health()
        .then(() => alive && setOnline(true))
        .catch(() => alive && setOnline(false));
    ping();
    const t = setInterval(ping, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <aside className="w-[232px] shrink-0 border-r border-line bg-bg-2 flex flex-col sticky top-0 h-screen">
      {/* logo */}
      <NavLink to="/" className="block px-5 py-5 border-b border-line group">
        <div className="font-mono text-cyan text-lg font-semibold tracking-tight flex items-center gap-1">
          xcj<span className="text-text-3">//</span>
          <span className="text-text group-hover:text-cyan transition-colors">
            archive
          </span>
        </div>
        <div className="kicker mt-1 text-text-3">research terminal · v0.2</div>
      </NavLink>

      {/* groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="kicker px-2 mb-2">{g.title}</div>
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center justify-between px-2 py-2 rounded-sm border border-transparent transition-colors group",
                      isActive
                        ? "bg-bg-3 text-cyan border-line-2"
                        : "text-text-2 hover:text-text hover:bg-bg-3",
                    ].join(" ")
                  }
                >
                  <span className="text-sm">{it.label}</span>
                  <span className="mono text-[10px] text-text-3 group-hover:text-cyan transition-colors">
                    {it.en}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* status */}
      <div className="px-5 py-4 border-t border-line">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background:
                online === null
                  ? "var(--text-3)"
                  : online
                    ? "var(--green)"
                    : "var(--red)",
              boxShadow: online
                ? "0 0 8px var(--green)"
                : online === false
                  ? "0 0 8px var(--red)"
                  : "none",
            }}
          />
          <span className="kicker">
            {online === null
              ? "connecting"
              : online
                ? "backend online"
                : "backend offline"}
          </span>
        </div>
      </div>
    </aside>
  );
}
