"""一次性回填「作者单位」(affiliation) 到已存在的 papers.db。

万方 CSV 本就含「作者单位」列（csv_meta 已识别 作者单位→affiliation），
但初版入库时 ingest._build_paper_record 未写入该列。本脚本复用 ingest 的
CSV 匹配逻辑（按清洗后的标题/文件名匹配），仅补 affiliation，不重新嵌入。

用法（仓库根目录，激活 .venv 或用 uv）：
    python -m scripts.backfill_affiliation
    DB_PATH=./data/storage/papers.db python -m scripts.backfill_affiliation
    python scripts/backfill_affiliation.py --data-dir ./data
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# 允许 `python scripts/backfill_affiliation.py` 直接运行（把仓库根加入 sys.path）。
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from pyservice import db as dbmod  # noqa: E402
from pyservice.csv_meta import load_metadata  # noqa: E402
from pyservice.ingest import _build_csv_indexes, _lookup_meta  # noqa: E402

DEFAULT_DB = "./data/storage/papers.db"
DEFAULT_DATA_DIR = "./data"


def run(args: argparse.Namespace) -> int:
    data_dir = Path(args.data_dir).expanduser().resolve()
    csv_path = data_dir / "WanFangdata.csv"
    db_path = args.db or os.environ.get("DB_PATH") or DEFAULT_DB

    print(f"[backfill] db  = {db_path}")
    print(f"[backfill] csv = {csv_path}")
    if not csv_path.exists():
        print(f"[error] csv not found at {csv_path}", file=sys.stderr)
        return 1

    df = load_metadata(str(csv_path))
    print(f"[backfill] csv rows = {len(df)}")
    csv_idx = _build_csv_indexes(df)

    conn = dbmod.connect(db_path)
    dbmod.ensure_schema(conn)  # 幂等补 affiliation 列

    rows = conn.execute(
        "SELECT paper_id, COALESCE(title,'') FROM papers_master"
    ).fetchall()
    total = len(rows)
    matched = 0
    filled = 0
    for paper_id, title in rows:
        meta = _lookup_meta(csv_idx, paper_id, title_hint=title or paper_id)
        if not meta:
            continue
        matched += 1
        affiliation = (meta.get("affiliation") or "").strip()
        if not affiliation:
            continue
        conn.execute(
            "UPDATE papers_master SET affiliation=? WHERE paper_id=?",
            (affiliation, paper_id),
        )
        filled += 1
    conn.commit()

    have = conn.execute(
        "SELECT COUNT(*) FROM papers_master WHERE affiliation IS NOT NULL AND affiliation != ''"
    ).fetchone()[0]
    conn.close()

    print(f"[backfill] papers={total} matched_csv={matched} filled={filled} now_have_affiliation={have}")
    if filled == 0:
        print("[warn] 没有任何论文被填入作者单位，请检查 CSV 匹配。", file=sys.stderr)
        return 2
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m scripts.backfill_affiliation",
        description="Backfill affiliation (作者单位) into existing papers.db from WanFangdata.csv.",
    )
    p.add_argument("--data-dir", default=DEFAULT_DATA_DIR, help="数据根目录（含 WanFangdata.csv）")
    p.add_argument("--db", default=None, help=f"SQLite 路径，默认 DB_PATH 或 {DEFAULT_DB}")
    return p


def main(argv=None) -> int:
    return run(build_parser().parse_args(argv))


if __name__ == "__main__":
    raise SystemExit(main())
