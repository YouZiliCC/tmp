import Kicker from "../components/Kicker";
import RuleHr from "../components/RuleHr";

interface Row {
  field: string;
  weight: string;
  use: string;
}

const FIELD_TABLE: Row[] = [
  { field: "title · 标题",      weight: "× 3.0", use: "短语完全命中加倍" },
  { field: "abstract · 摘要",   weight: "× 1.5", use: "段落语义匹配" },
  { field: "keywords · 关键词", weight: "× 2.0", use: "受控词单独打分" },
  { field: "author · 作者",     weight: "× 1.2", use: "实体精确匹配优先" },
  { field: "journal · 刊名",    weight: "× 0.8", use: "用作过滤而非主排序" },
  { field: "chunks · 段落",     weight: "× 1.0", use: "稠密向量召回单位" },
];

export default function Help() {
  return (
    <article className="fade-up">
      <Kicker block>Colophon · 刊例</Kicker>
      <h1
        className="font-display font-black text-ink-dark leading-none mt-3"
        style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)", fontVariationSettings: '"opsz" 144' }}
      >
        刊例
        <span className="font-display italic font-light text-ink-3 ml-3 text-[0.45em]">
          how this journal is made
        </span>
      </h1>
      <p className="epigraph mt-3 max-w-3xl">
        本卷于编辑部尾页谨陈检索原理、数据来源与使用说明，以便读者复核。
      </p>

      <RuleHr variant="thick" className="mt-6" />

      {/* === Section I === */}
      <section className="mt-10 grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-3">
          <div className="font-display font-black text-ink-dark"
               style={{ fontSize: "3rem", lineHeight: 1, fontVariationSettings: '"opsz" 144' }}>
            I
          </div>
          <Kicker block>Methodology</Kicker>
        </div>
        <div className="col-span-12 md:col-span-9">
          <h2 className="section-title">检索原理</h2>
          <div className="body-prose mt-4">
            本系统采用"卡片柜 + 语义"双轨制。传统检索以 BM25 倒排索引为底，
            在 title / abstract / keywords / author / journal 五字段上加权求和；
            智能检索则先以大模型将自然语言重写为结构化查询包，
            分别以 BM25 与稠密向量召回，融合排序为 golden 榜。
            生成式综述只允许引用被用户勾选的论文，其余文本不入引文库，以防"幻觉式综述"。
          </div>

          <div className="mt-8">
            <Kicker block>Field Weights · 字段权重</Kicker>
            <table className="j-table mt-3">
              <thead>
                <tr>
                  <th>Field · 字段</th>
                  <th style={{ width: 110 }}>Weight</th>
                  <th>Behaviour · 用法</th>
                </tr>
              </thead>
              <tbody>
                {FIELD_TABLE.map((r) => (
                  <tr key={r.field}>
                    <td>{r.field}</td>
                    <td className="font-mono tnum">{r.weight}</td>
                    <td className="text-ink-2">{r.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <RuleHr className="mt-12" />

      {/* === Section II === */}
      <section className="mt-10 grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-3">
          <div className="font-display font-black text-ink-dark"
               style={{ fontSize: "3rem", lineHeight: 1, fontVariationSettings: '"opsz" 144' }}>
            II
          </div>
          <Kicker block>Sources</Kicker>
        </div>
        <div className="col-span-12 md:col-span-9">
          <h2 className="section-title">数据来源</h2>
          <div className="body-prose mt-4">
            语料以中文人文社科论文为主，字段含 paper_id、标题、作者、年份、刊名、
            DOI、摘要、关键词，并按章节切分为 chunks。所有原文均保留于本地存储，
            索引随后端启动构建，向量模型可于 .env 中按需替换。
          </div>
          <ul className="mt-6 space-y-2 font-serif text-[0.96rem]">
            {[
              "原始数据：data/ 下的结构化 JSON / CSV",
              "BM25 索引：后端启动时由 pyservice 构建并落盘",
              "向量索引：以中文 sentence embedding 在 chunk 粒度构建",
              "历史记录：仅记录查询字符串，不记录用户身份",
            ].map((s, i) => (
              <li key={i} className="grid grid-cols-[32px_1fr] gap-2">
                <span className="font-mono text-[0.78rem] tnum text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RuleHr className="mt-12" />

      {/* === Section III === */}
      <section className="mt-10 grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-3">
          <div className="font-display font-black text-ink-dark"
               style={{ fontSize: "3rem", lineHeight: 1, fontVariationSettings: '"opsz" 144' }}>
            III
          </div>
          <Kicker block>Usage</Kicker>
        </div>
        <div className="col-span-12 md:col-span-9">
          <h2 className="section-title">使用说明</h2>
          <div className="body-prose mt-4">
            "传统检索"适用于已知字段的查找；左侧填表，右侧出目录页，每条带相关性短线。
            "智能检索"以自然语言提问，先观察重写卡再勾选感兴趣的论文，
            最后点"生成分析报告"获得带 [n] 角注的综述。每条引文可展开原文片段以供校对。
          </div>

          <div className="mt-6 font-mono text-[0.84rem] text-ink-2 leading-[1.8]">
            <div className="text-ink-3 uppercase tracking-[0.16em] text-[0.7rem] mb-2">
              SHORTCUTS · 操作要点
            </div>
            <div>· 朱红色仅用于强调：rank、score、命中字段。</div>
            <div>· 卡片左缘的细条 hover 时会扩宽，表示可点击。</div>
            <div>· 勾选框出现 ✓ 即被纳入综述引文库。</div>
            <div>· 详情页底部"copy · 复制"将引用按 GB/T 7714 (近似) 写入剪贴板。</div>
          </div>
        </div>
      </section>

      <RuleHr variant="double" className="mt-16" />
      <div className="mt-4 text-center font-mono text-[0.72rem] tracking-[0.18em] uppercase text-ink-3">
        — end of colophon —
      </div>
    </article>
  );
}
