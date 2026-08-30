/**
 * data/champions.json の読み込み・採点・書き出しを担う共有モジュール。
 *
 * build-champions.ts（一括生成）と input-champions.ts（対話入力）が
 * 同じ計算・同じ出力形式を使うために切り出してある。
 * ここを二重実装すると「入力ツールでは AP なのに再生成すると HYBRID」といった
 * 食い違いが起きうるため、採点は必ずこのモジュール経由で行うこと。
 */
import {
  PATHS,
  readJsonIfExists,
  readMeta,
  writeJson,
  type DdragonChampionFile,
} from "./lib.js";
import { THRESHOLDS, type Answer } from "../src/config.js";

export type ItemType = "AP" | "AD" | "NONE";

export interface ClassifiedItems {
  patch: string;
  items: Record<string, { name: string; type: ItemType }>;
}

export interface ChampionOut {
  id: string;
  name_ja: string;
  name_en: string;
  image: string;
  answer: Answer | "";
  ap_ratio: number | null;
  core_items: number[];
  note?: string;
  excluded: boolean;
}

export interface ChampionsFile {
  patch: string;
  generated_at: string | null;
  source: string;
  thresholds: { ap: number; ad: number };
  champions: ChampionOut[];
}

/** 人力入力ぶんだけを保持する値。ここ以外の項目はすべて再生成できる。 */
export interface ChampionInput {
  core_items: number[];
  note?: string;
}

export interface ChampionSources {
  patch: string;
  championJa: DdragonChampionFile;
  championEn: DdragonChampionFile;
  classified: ClassifiedItems;
  /** champion id -> 人力入力。対話入力ツールはこれを書き換えて再生成する。 */
  inputs: Map<string, ChampionInput>;
}

export interface Score {
  ap: number;
  ad: number;
  /** AP/AD どちらにも数えないアイテム数（タンク装備・ブーツ・魔力物理両持ち）。 */
  none: number;
  ap_ratio: number | null;
  answer: Answer | "";
}

export function labelFor(ratio: number): Answer {
  if (ratio >= THRESHOLDS.ap) return "AP";
  if (ratio <= THRESHOLDS.ad) return "AD";
  return "HYBRID";
}

/** core_items から ap_ratio と answer を算出。判定不能なら null / "" を返す。 */
export function scoreCoreItems(
  coreItems: number[],
  classified: ClassifiedItems["items"],
): Score {
  let ap = 0;
  let ad = 0;
  let none = 0;
  for (const id of coreItems) {
    const t = classified[String(id)]?.type;
    if (t === "AP") ap++;
    else if (t === "AD") ad++;
    else none++;
  }
  const total = ap + ad;
  if (total === 0) return { ap, ad, none, ap_ratio: null, answer: "" };
  const ratio = ap / total;
  return {
    ap,
    ad,
    none,
    ap_ratio: Math.round(ratio * 100) / 100,
    answer: labelFor(ratio),
  };
}

/**
 * 生成に必要な入力をすべて読む。
 * 既存 champions.json の core_items / note は人力入力なので必ず引き継ぐ。
 */
export async function loadChampionSources(): Promise<ChampionSources> {
  const [championJa, championEn] = await Promise.all([
    readJsonIfExists<DdragonChampionFile>(PATHS.rawChampionJa),
    readJsonIfExists<DdragonChampionFile>(PATHS.rawChampionEn),
  ]);
  if (!championJa || !championEn) {
    throw new Error(
      "data/raw/champion.*.json がありません。先に npm run fetch:ddragon を実行してください。",
    );
  }
  const classified = await readJsonIfExists<ClassifiedItems>(
    PATHS.itemsClassifiedJson,
  );
  if (!classified) {
    throw new Error(
      "data/items-classified.json がありません。先に npm run classify:items を実行してください。",
    );
  }
  const meta = await readMeta();
  const existing = await readJsonIfExists<ChampionsFile>(PATHS.championsJson);

  const inputs = new Map<string, ChampionInput>();
  for (const c of existing?.champions ?? []) {
    inputs.set(c.id, {
      core_items: c.core_items ?? [],
      ...(c.note ? { note: c.note } : {}),
    });
  }

  return {
    patch: meta?.patch ?? championJa.version ?? "unknown",
    championJa,
    championEn,
    classified,
    inputs,
  };
}

export function buildChampionsFile(sources: ChampionSources): ChampionsFile {
  const { patch, championJa, championEn, classified, inputs } = sources;
  const ids = Object.keys(championJa.data).sort();

  const champions: ChampionOut[] = ids.map((id) => {
    const ja = championJa.data[id];
    const en = championEn.data[id];
    const input = inputs.get(id);
    const coreItems = input?.core_items ?? [];
    const { ap_ratio, answer } = scoreCoreItems(coreItems, classified.items);
    return {
      id,
      name_ja: ja.name,
      name_en: en?.name ?? id,
      image: ja.image.full,
      answer,
      ap_ratio,
      core_items: coreItems,
      ...(input?.note ? { note: input.note } : {}),
      excluded: answer === "HYBRID",
    };
  });

  return {
    patch,
    generated_at: new Date().toISOString().slice(0, 10),
    // 既存値を温存すると patch 更新後もここだけ古いまま残るため毎回再生成する。
    source: `Data Dragon patch ${patch}（core_items は手入力）`,
    thresholds: { ap: THRESHOLDS.ap, ad: THRESHOLDS.ad },
    champions,
  };
}

export async function writeChampionsFile(file: ChampionsFile): Promise<void> {
  await writeJson(PATHS.championsJson, file);
}
