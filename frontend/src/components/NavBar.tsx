import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "封面", en: "Cover", end: true },
  { to: "/search", label: "传统检索", en: "Indexing" },
  { to: "/smart", label: "智能检索", en: "Generative" },
  { to: "/help", label: "刊例", en: "Colophon" },
];

export default function NavBar() {
  return (
    <nav className="border-b border-rule">
      <div className="max-w-column mx-auto px-6">
        <ul className="flex items-stretch gap-8">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "group inline-flex items-baseline gap-2 py-3 transition-colors",
                    isActive ? "text-ink" : "text-ink-2 hover:text-ink",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="font-serif text-[1.02rem]">
                      <span
                        className={[
                          "hover-uline",
                          isActive ? "border-b border-ink pb-[2px]" : "",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                    </span>
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-3">
                      {item.en}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
