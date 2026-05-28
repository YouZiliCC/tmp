// ============================================================
// Lightweight utilities used across pages
// ============================================================

const CN_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** 1..99 to Chinese characters (一, 二, ... 九十九) */
export function toCnNumber(n: number): string {
  if (n < 0) return "负" + toCnNumber(-n);
  if (n < 10) return CN_DIGITS[n];
  if (n < 20) return n === 10 ? "十" : "十" + CN_DIGITS[n - 10];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return CN_DIGITS[t] + "十" + (u ? CN_DIGITS[u] : "");
  }
  return String(n);
}

/** "01", "02", ..., "10", ... */
export function padOrdinal(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/** 1..20 Roman numerals */
export function toRoman(n: number): string {
  if (n < 1 || n > 20 || !Number.isInteger(n)) return String(n);
  const romans = [
    "I", "II", "III", "IV", "V",
    "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV",
    "XVI", "XVII", "XVIII", "XIX", "XX",
  ];
  return romans[n - 1];
}

/** "JAN. 28, 2026" */
export function dateLine(d = new Date()): string {
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  const m = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}. ${day}, ${d.getFullYear()}`;
}

function splitAuthorList(a: string[] | string | undefined): string[] {
  if (!a) return [];
  if (Array.isArray(a)) return a.filter(Boolean);
  return a
    .split(/[,;，；、]/)
    .map((s) => s.trim().replace(/[.\s]+$/, ""))
    .filter(Boolean);
}

export function joinAuthors(a: string[] | string | undefined): string {
  return splitAuthorList(a).join("、");
}

export function firstAuthorEtAl(a: string[] | string | undefined): string {
  const list = splitAuthorList(a);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list[0]} 等`;
}

export function splitKeywords(k: string[] | string | undefined): string[] {
  if (!k) return [];
  if (Array.isArray(k)) return k.filter(Boolean);
  return k
    .split(/[,;，；、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** clamp 0..1 with safe number */
export function normScore(s: number, max = 1): number {
  if (!Number.isFinite(s)) return 0;
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, s / max));
}

/** GB/T 7714 citation string (lightweight, not strict spec) */
export function citationGB(p: {
  author: string[] | string;
  title: string;
  journal: string;
  year: number | string;
  doi?: string;
}): string {
  const list = splitAuthorList(p.author);
  const authors =
    list.length === 0
      ? ""
      : list.slice(0, 3).join(", ") + (list.length > 3 ? ", 等" : "");
  const doi = p.doi ? ` DOI:${p.doi}.` : "";
  return `${authors}. ${p.title}[J]. ${p.journal}, ${p.year}.${doi}`;
}
