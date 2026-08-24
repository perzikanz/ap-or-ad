/**
 * data/champions.json（出題データ）を生成／更新する。
 *
 * - 初回: 全チャンピオンの雛形を作る（core_items は空、answer は未確定）。
 * - Phase 2 以降: 既存 champions.json の core_items（人間が入力した値）を保持したまま、
 *   items-classified.json を使って ap_ratio と answer を自動計算して上書きする。
 *
 * 正解の決め方（PLAN.md 1.1 / CLAUDE.md）:
 *   ap_ratio = APアイテム数 / (APアイテム数 + ADアイテム数)   ※ NONE は除外
 *   ratio >= THRESHOLDS.ap -> "AP" / ratio <= THRESHOLDS.ad -> "AD" / それ以外 -> "HYBRID"
 *   ⚠ champion.json の info.attack / info.magic / tags は絶対に使わない。
 *
 * 生成物: data/champions.json
 * 実行: npm run build:champions
 */
import {
  PATHS,
  readJsonIfExists,
  readMeta,
  writeJson,
  type DdragonChampionFile,
} from "./lib.js";
import { THRESHOLDS, type Answer } from "../src/config.js";

interface ClassifiedItems {
  patch: string;
  items: Record<string, { name: string; type: "AP" | "AD" | "NONE" }>;
}

interface ChampionOut {
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

interface ChampionsFile {
  patch: string;
  generated_at: string | null;
  source: string;
  thresholds: { ap: number; ad: number };
  champions: ChampionOut[];
}

function labelFor(ratio: number): Answer {
  if (ratio >= THRESHOLDS.ap) return "AP";
  if (ratio <= THRESHOLDS.ad) return "AD";
  return "HYBRID";
}

/** core_items から ap_ratio と answer を算出。判定不能なら null / "" を返す。 */
function score(
  coreItems: number[],
  classified: ClassifiedItems["items"],
): { ap_ratio: number | null; answer: Answer | "" } {
  let ap = 0;
  let ad = 0;
  for (const id of coreItems) {
    const t = classified[String(id)]?.type;
    if (t === "AP") ap++;
    else if (t === "AD") ad++;
  }
  const total = ap + ad;
  if (total === 0) return { ap_ratio: null, answer: "" };
  const ratio = ap / total;
  return { ap_ratio: Math.round(ratio * 100) / 100, answer: labelFor(ratio) };
}

async function main() {
  const championJa = await readJsonIfExists<DdragonChampionFile>(
    PATHS.rawChampionJa,
  );
  const championEn = await readJsonIfExists<DdragonChampionFile>(
    PATHS.rawChampionEn,
  );
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
  const patch = meta?.patch ?? championJa.version ?? "unknown";

  // 既存の人力入力（core_items / note）を保持するためのマップ。
  const existing = await readJsonIfExists<ChampionsFile>(PATHS.championsJson);
  const prevById = new Map<string, ChampionOut>();
  for (const c of existing?.champions ?? []) prevById.set(c.id, c);

  const ids = Object.keys(championJa.data).sort();
  const champions: ChampionOut[] = ids.map((id) => {
    const ja = championJa.data[id];
    const en = championEn.data[id];
    const prev = prevById.get(id);
    const coreItems = prev?.core_items ?? [];
    const { ap_ratio, answer } = score(coreItems, classified.items);
    return {
      id,
      name_ja: ja.name,
      name_en: en?.name ?? id,
      image: ja.image.full,
      answer,
      ap_ratio,
      core_items: coreItems,
      ...(prev?.note ? { note: prev.note } : {}),
      excluded: answer === "HYBRID",
    };
  });

  const out: ChampionsFile = {
    patch,
    generated_at: new Date().toISOString().slice(0, 10),
    // 既存値を温存すると patch 更新後もここだけ古いまま残るため毎回再生成する。
    source: `Data Dragon patch ${patch}（core_items は手入力）`,
    thresholds: { ap: THRESHOLDS.ap, ad: THRESHOLDS.ad },
    champions,
  };

  await writeJson(PATHS.championsJson, out);

  const withItems = champions.filter((c) => c.core_items.length > 0).length;
  const labeled = champions.filter((c) => c.answer !== "").length;
  const hybrid = champions.filter((c) => c.answer === "HYBRID").length;
  console.log(`[build] patch = ${patch}`);
  console.log(`[build] champions total = ${champions.length}`);
  console.log(`[build] core_items 入力済み = ${withItems}`);
  console.log(`[build] answer 確定 = ${labeled}（うち HYBRID = ${hybrid}）`);
  console.log(`[build] wrote ${PATHS.championsJson}`);
}

main().catch((err) => {
  console.error("[build] FAILED:", err);
  process.exitCode = 1;
});
