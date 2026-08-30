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
 * core_items の入力自体は npm run input:champions（対話ツール）で行う。
 *
 * 生成物: data/champions.json
 * 実行: npm run build:champions
 */
import { PATHS } from "./lib.js";
import {
  buildChampionsFile,
  loadChampionSources,
  writeChampionsFile,
} from "./champions.js";

async function main() {
  const sources = await loadChampionSources();
  const out = buildChampionsFile(sources);
  await writeChampionsFile(out);

  const { champions } = out;
  const withItems = champions.filter((c) => c.core_items.length > 0).length;
  const labeled = champions.filter((c) => c.answer !== "").length;
  const hybrid = champions.filter((c) => c.answer === "HYBRID").length;
  console.log(`[build] patch = ${out.patch}`);
  console.log(`[build] champions total = ${champions.length}`);
  console.log(`[build] core_items 入力済み = ${withItems}`);
  console.log(`[build] answer 確定 = ${labeled}（うち HYBRID = ${hybrid}）`);
  console.log(`[build] wrote ${PATHS.championsJson}`);
}

main().catch((err) => {
  console.error("[build] FAILED:", err);
  process.exitCode = 1;
});
