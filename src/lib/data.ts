import championsData from "../../data/champions.json";
import type { Answer } from "@/config";

/** 1チャンピオン分の出題データ（data/champions.json の要素）。 */
export interface Champion {
  /** Data Dragon の key（例: "Teemo"）。 */
  id: string;
  name_ja: string;
  name_en: string;
  /** public/champions/ 配下のファイル名（例: "Teemo.png"）。 */
  image: string;
  /** "AP" | "AD" | "HYBRID"。空文字は未入力（Phase 2 待ち）。 */
  answer: Answer | "";
  /** APアイテム比率。0〜1。未算出は null。 */
  ap_ratio: number | null;
  /** コアアイテムID配列。 */
  core_items: number[];
  /** 任意の補足メモ。 */
  note?: string;
  /** 通常モードから除外するか（HYBRID は true）。 */
  excluded: boolean;
}

/** data/champions.json 全体の型。 */
export interface ChampionsFile {
  patch: string;
  generated_at: string | null;
  source: string;
  thresholds: { ap: number; ad: number };
  champions: Champion[];
}

const data = championsData as ChampionsFile;

/** パッチバージョン（フッター表示用）。データ未生成なら "unknown"。 */
export const PATCH: string = data.patch;

/** 全チャンピオン（未入力・HYBRID 含む）。 */
export const ALL_CHAMPIONS: Champion[] = data.champions;

/**
 * 通常モードの出題対象。
 * answer が確定していて（AP または AD）、excluded でないものだけ。
 */
export function normalModeChampions(): Champion[] {
  return ALL_CHAMPIONS.filter(
    (c) => !c.excluded && (c.answer === "AP" || c.answer === "AD"),
  );
}

/** 魔境モードの出題対象（HYBRID のみ）。 */
export function hybridModeChampions(): Champion[] {
  return ALL_CHAMPIONS.filter((c) => c.answer === "HYBRID");
}

/** データが入っているか（雛形のままなら false）。 */
export function hasData(): boolean {
  return ALL_CHAMPIONS.length > 0;
}
