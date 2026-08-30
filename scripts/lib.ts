/**
 * Phase 1 スクリプト共通ヘルパー。
 *
 * すべて認証不要・無料の Data Dragon 静的 CDN を使う（PLAN.md 5章）。
 * 実行時ではなく **ビルド/開発時** にだけ叩き、結果はリポジトリに同梱する。
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** リポジトリルート（scripts/ の一つ上）。 */
export const ROOT = path.resolve(__dirname, "..");

export const PATHS = {
  dataDir: path.join(ROOT, "data"),
  rawDir: path.join(ROOT, "data", "raw"),
  championsJson: path.join(ROOT, "data", "champions.json"),
  itemsClassifiedJson: path.join(ROOT, "data", "items-classified.json"),
  rawChampionJa: path.join(ROOT, "data", "raw", "champion.ja_JP.json"),
  rawChampionEn: path.join(ROOT, "data", "raw", "champion.en_US.json"),
  rawItemJa: path.join(ROOT, "data", "raw", "item.ja_JP.json"),
  rawItemEn: path.join(ROOT, "data", "raw", "item.en_US.json"),
  rawMeta: path.join(ROOT, "data", "raw", "meta.json"),
  championsImgDir: path.join(ROOT, "public", "champions"),
};

export const DDRAGON = {
  base: "https://ddragon.leagueoflegends.com",
  versions: "https://ddragon.leagueoflegends.com/api/versions.json",
  championUrl: (ver: string, locale: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${ver}/data/${locale}/champion.json`,
  itemUrl: (ver: string, locale: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${ver}/data/${locale}/item.json`,
  championImgUrl: (ver: string, imageFull: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${ver}/img/champion/${imageFull}`,
} as const;

export const LOCALES = { ja: "ja_JP", en: "en_US" } as const;

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function readJsonIfExists<T = unknown>(
  file: string,
): Promise<T | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** 最新パッチバージョン文字列を返す（versions.json の先頭）。 */
export async function getLatestVersion(): Promise<string> {
  const versions = await fetchJson<string[]>(DDRAGON.versions);
  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error("versions.json が空か配列ではありません");
  }
  return versions[0];
}

/** raw/meta.json（fetch 実行時のパッチ等）を読む。未実行なら null。 */
export async function readMeta(): Promise<{ patch: string } | null> {
  return readJsonIfExists<{ patch: string }>(PATHS.rawMeta);
}

/* ---- Data Dragon のレスポンス型（必要な部分だけ） ---- */

export interface DdragonImage {
  full: string;
}

export interface DdragonChampionEntry {
  id: string; // "Teemo"
  key: string; // "17"（数値文字列）
  name: string; // ロケール依存の表示名
  title: string;
  image: DdragonImage;
  tags: string[];
  partype: string;
}

export interface DdragonChampionFile {
  type: string;
  format: string;
  version: string;
  data: Record<string, DdragonChampionEntry>;
}

export interface DdragonItemEntry {
  name: string;
  /** 別名・英語名・かな読みを ";" 区切りで並べた検索用文字列。空のアイテムもある。 */
  colloq?: string;
  stats: Record<string, number>;
  /** マップID -> 使用可否。サモナーズリフトは "11"。 */
  maps?: Record<string, boolean>;
  gold?: { total: number; purchasable: boolean };
  /** このアイテムを素材とする上位アイテムのID。空なら完成品。 */
  into?: string[];
}

export interface DdragonItemFile {
  type: string;
  version: string;
  data: Record<string, DdragonItemEntry>;
}
