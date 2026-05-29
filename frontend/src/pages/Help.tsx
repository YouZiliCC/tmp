import SectionTitle from "../components/SectionTitle";

export default function Help() {
  return (
    <div className="space-y-8 stagger max-w-3xl">
      <div>
        <div className="kicker mb-3">// colophon</div>
        <h1 className="font-display font-bold text-2xl">帮助与说明</h1>
      </div>

      <section>
        <SectionTitle>retrieval · 检索原理</SectionTitle>
        <div className="space-y-3 text-sm leading-relaxed text-text-2">
          <p>
            系统对每篇论文按字段（标题/关键词/摘要/研究设计/正文）分别建立倒排，检索时用
            <span className="text-amber"> BM25 </span>
            打分并按字段加权（标题 8 · 关键词 5 · 研究设计 4 · 摘要 3 · 正文 1）。
          </p>
          <p>
            智能检索额外引入
            <span className="text-violet"> 稠密向量 </span>
            语义召回：用本地 BGE 模型把查询与文本块编码为向量做余弦近邻，再与 BM25 结果用
            <span className="text-cyan"> RRF </span>
            （倒数排名融合，k=60）合成黄金排行榜。
          </p>
        </div>
      </section>

      <section>
        <SectionTitle>agents · 智能体能力</SectionTitle>
        <ul className="space-y-2 text-sm leading-relaxed text-text-2">
          <li><span className="chip chip-cyan mr-2">智能问答</span>检索证据文献后直接回答问题，附参考文献表。</li>
          <li><span className="chip chip-cyan mr-2">文献综述</span>自动综述（检索自选）/ 自选综述（DOI/标题精确定位）。</li>
          <li><span className="chip chip-cyan mr-2">AI 概要</span>自动产出论文概要 / 方法 / 结果 / 关键词。</li>
          <li><span className="chip chip-cyan mr-2">AI 同读</span>基于单篇论文全文问答。</li>
          <li><span className="chip chip-cyan mr-2">思维导图</span>由论文生成 Mermaid 导图并渲染。</li>
          <li><span className="chip chip-cyan mr-2">相关文献</span>以本文关键词 + 摘要向量复刻双路检索，加权给出相关论文。</li>
        </ul>
      </section>

      <section>
        <SectionTitle>data · 数据来源</SectionTitle>
        <p className="text-sm leading-relaxed text-text-2">
          语料来自万方学术中文人文社科论文（Word 全文 + CSV 元数据），仅用于课程教学。底层存储为
          SQLite（关系数据 + 内嵌向量），LLM 使用火山方舟 DeepSeek，嵌入使用本地 BAAI/bge-small-zh-v1.5。
        </p>
      </section>
    </div>
  );
}
