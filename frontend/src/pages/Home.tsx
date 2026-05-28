import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { StatsResponse } from "../api/types";
import Kicker from "../components/Kicker";
import RomanNumeral from "../components/RomanNumeral";
import Bars from "../components/Bars";
import RuleHr from "../components/RuleHr";

interface EntryProps {
  numeral: number;
  kicker: string;
  title: string;
  zh: string;
  body: string;
  to: string;
}

function Entry({ numeral, kicker, title, zh, body, to }: EntryProps) {
  return (
    <Link to={to} className="block group">
      <article className="j-card h-full">
        <div className="flex items-start gap-7">
          <div className="pt-1 shrink-0">
            <RomanNumeral n={numeral} />
          </div>
          <div className="flex-1">
            <Kicker block>{kicker}</Kicker>
            <h3
              className="font-display font-black text-ink-dark leading-[1.05] mt-2"
              style={{ fontSize: "2.1rem", fontVariationSettings: '"opsz" 144' }}
            >
              {title}
            </h3>
            <div className="font-serif text-ink-2 italic mt-0.5 mb-3">{zh}</div>
            <p className="font-serif text-[0.98rem] leading-[1.7] text-ink-2">
              {body}
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-3 group-hover:text-vermillion transition-colors">
                Enter
              </span>
              <span className="font-display text-[1.6rem] text-ink-2 group-hover:text-vermillion transition-colors">
                →
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function StatCell({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <div className="kicker">{label}</div>
      <div
        className="font-display font-black text-ink-dark tnum mt-2"
        style={{ fontSize: "3.2rem", lineHeight: 0.95, fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[0.72rem] text-ink-3 mt-1 tracking-wider tnum">
          {sub}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.stats()
      .then(setStats)
      .catch((e: Error) => setErr(e.message));
  }, []);

  const years = stats?.year_dist ?? {};
  const yearKeys = Object.keys(years).map(Number).filter((n) => !isNaN(n)).sort();
  const yMin = yearKeys[0];
  const yMax = yearKeys[yearKeys.length - 1];

  return (
    <div className="stagger">
      {/* Epigraph */}
      <section className="grid grid-cols-12 gap-6 mt-2">
        <div className="col-span-12 md:col-span-7">
          <Kicker block>Editorial · 卷首语</Kicker>
          <blockquote className="epigraph mt-4 pl-5 border-l border-vermillion">
            <span className="font-display italic">
              “A library is a discipline of attention; the catalogue is its grammar.”
            </span>
            <div className="font-serif not-italic text-ink-2 mt-3 leading-[1.7] text-[1rem]">
              图书馆是一种凝神的训练，目录则是它的语法。
              本期由一组以中文人文社科论文为底本的检索系统组成，
              既呈传统倒排索引的"卡片柜"，亦试以生成式重写与稠密向量
              重组同一文本宇宙。
            </div>
          </blockquote>
        </div>

        <div className="col-span-12 md:col-span-5 md:pl-10 md:border-l md:border-rule">
          <Kicker block>In This Issue · 本期辑录</Kicker>
          <ol className="mt-3 space-y-2 font-serif text-[0.96rem]">
            <li className="grid grid-cols-[28px_1fr] gap-2">
              <span className="font-mono tnum text-ink-3 text-[0.78rem]">01</span>
              <span>传统检索：以字段为目的卡片柜式检索</span>
            </li>
            <li className="grid grid-cols-[28px_1fr] gap-2">
              <span className="font-mono tnum text-ink-3 text-[0.78rem]">02</span>
              <span>智能检索：以语义为目的研究性检索</span>
            </li>
            <li className="grid grid-cols-[28px_1fr] gap-2">
              <span className="font-mono tnum text-ink-3 text-[0.78rem]">03</span>
              <span>分析报告：自动综述 + 引文回溯</span>
            </li>
            <li className="grid grid-cols-[28px_1fr] gap-2">
              <span className="font-mono tnum text-ink-3 text-[0.78rem]">04</span>
              <span>刊例：字段权重、数据来源与使用说明</span>
            </li>
          </ol>
        </div>
      </section>

      <RuleHr variant="thick" className="mt-12" />

      {/* Two entries */}
      <section className="mt-10">
        <Kicker block>The Two Reading Rooms · 两间阅览室</Kicker>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Entry
            numeral={1}
            kicker="Section I · 卡片式检索"
            title="Traditional Indexing"
            zh="传统检索"
            body="按字段（标题、作者、年份、刊名、关键词）逐项过滤；命中以朱红色高亮显示。适合已知作者、关键词或追踪某一刊物上的论文。"
            to="/search"
          />
          <Entry
            numeral={2}
            kicker="Section II · 语义式检索"
            title="Generative Analysis"
            zh="智能检索"
            body="将自然语言问题重写为结构化查询包，混合 BM25 与稠密向量。可勾选论文进入生成式综述，输出带引文的回答。"
            to="/smart"
          />
        </div>
      </section>

      <RuleHr variant="thick" className="mt-12" />

      {/* Statistics */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <Kicker block>Statistics · 馆藏概览</Kicker>
            <h2 className="section-title mt-2">藏书一览</h2>
          </div>
          {err && (
            <div className="font-mono text-[0.74rem] text-vermillion">
              · stats unavailable: {err}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
          <StatCell
            value={stats ? String(stats.paper_count) : "—"}
            label="Papers · 论文数"
            sub="entries indexed"
          />
          <StatCell
            value={stats ? String(stats.chunk_count) : "—"}
            label="Chunks · 切块数"
            sub="passages segmented"
          />
          <StatCell
            value={
              yMin && yMax ? `${yMin}–${yMax}` : "—"
            }
            label="Years · 收录年份"
            sub="coverage range"
          />
          <StatCell
            value={stats ? String(stats.top_journals?.length ?? 0) : "—"}
            label="Journals · 刊物数"
            sub="distinct venues"
          />
        </div>

        <div className="mt-12">
          <Kicker block>Year Distribution · 年份分布</Kicker>
          <div className="mt-6 border-t border-rule pt-6">
            <Bars data={years} />
          </div>
        </div>

        {stats?.top_journals?.length ? (
          <div className="mt-12">
            <Kicker block>Top Journals · 主要刊物</Kicker>
            <table className="j-table mt-4">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>No.</th>
                  <th>Journal · 刊名</th>
                  <th style={{ width: 120 }} className="text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_journals.slice(0, 8).map((j, i) => (
                  <tr key={j.name}>
                    <td className="font-mono text-ink-3 tnum">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="font-serif italic">{j.name}</td>
                    <td className="font-mono text-right tnum">{j.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
