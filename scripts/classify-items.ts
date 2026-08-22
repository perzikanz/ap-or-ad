/**
 * data/raw/item.ja_JP.json を読み、各アイテムを AP / AD / NONE に分類する。
 *
 * 分類ルール（PLAN.md 1.1）:
 *   stats.FlatMagicDamageMod    > 0            -> "AP"
 *   stats.FlatPhysicalDamageMod > 0            -> "AD"
 *   両方 0（タンク装備・ブーツ等）             -> "NONE"
 *
 * 両方 > 0 のアイテム（存在すれば）は "NONE" 扱いにしつつ警告ログを出す。
 * フィールド名は検証タスクで確認する（scripts/verify-data.ts）。
 *
 * 生成物: data/items-classified.json
 * 実行: npm run classify:items
 */
import {
  PATHS,
  readJsonIfExists,
  readMeta,
  writeJson,
  type DdragonItemFile,
} from "./lib.js";

const MAGIC_FIELD = "FlatMagicDamageMod";
const PHYSICAL_FIELD = "FlatPhysicalDamageMod";

type ItemType = "AP" | "AD" | "NONE";

function classify(stats: Record<string, number>): ItemType {
  const magic = stats?.[MAGIC_FIELD] ?? 0;
  const physical = stats?.[PHYSICAL_FIELD] ?? 0;
  const isAp = magic > 0;
  const isAd = physical > 0;
  if (isAp && !isAd) return "AP";
  if (isAd && !isAp) return "AD";
  return "NONE";
}

async function main() {
  const itemFile = await readJsonIfExists<DdragonItemFile>(PATHS.rawItem);
  if (!itemFile) {
    throw new Error(
      `${PATHS.rawItem} がありません。先に npm run fetch:ddragon を実行してください。`,
    );
  }
  const meta = await readMeta();
  const patch = meta?.patch ?? itemFile.version ?? "unknown";

  const out: Record<string, { name: string; type: ItemType }> = {};
  const counts = { AP: 0, AD: 0, NONE: 0 } as Record<ItemType, number>;
  const both: string[] = [];

  for (const [id, entry] of Object.entries(itemFile.data)) {
    const stats = entry.stats ?? {};
    const type = classify(stats);
    if ((stats[MAGIC_FIELD] ?? 0) > 0 && (stats[PHYSICAL_FIELD] ?? 0) > 0) {
      both.push(`${id} (${entry.name})`);
    }
    out[id] = { name: entry.name, type };
    counts[type]++;
  }

  await writeJson(PATHS.itemsClassifiedJson, { patch, items: out });

  console.log(`[classify] patch = ${patch}`);
  console.log(
    `[classify] AP=${counts.AP} AD=${counts.AD} NONE=${counts.NONE} total=${
      counts.AP + counts.AD + counts.NONE
    }`,
  );
  if (both.length > 0) {
    console.warn(
      `[classify] ⚠ 魔力+物理 両方>0 のアイテムが ${both.length} 件（NONE 扱い）:`,
    );
    for (const b of both) console.warn(`  - ${b}`);
  }
  console.log(`[classify] wrote ${PATHS.itemsClassifiedJson}`);
}

main().catch((err) => {
  console.error("[classify] FAILED:", err);
  process.exitCode = 1;
});
