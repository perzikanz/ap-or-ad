/**
 * PLAN.md 5章「検証タスク」を実データに対して実行し、結果をログに残す。
 * 想定と実データが違えば PLAN.md を更新すること（このスクリプトは判定して警告するだけ）。
 *
 * 検証項目:
 *   1. api/versions.json が生きているか / 最新バージョン文字列
 *   2. item.json の stats フィールド名が FlatMagicDamageMod / FlatPhysicalDamageMod か
 *   3. champion.json のチャンピオン総数（172体前後の想定）
 *   4. チャンピオン画像 URL のパス構造が正しいか
 *
 * 実行: npm run verify:data
 */
import {
  DDRAGON,
  LOCALES,
  fetchJson,
  getLatestVersion,
  type DdragonChampionFile,
  type DdragonItemFile,
} from "./lib.js";

const EXPECTED_CHAMPION_COUNT = 172; // PLAN.md の想定。ズレたら PLAN 更新。
const MAGIC_FIELD = "FlatMagicDamageMod";
const PHYSICAL_FIELD = "FlatPhysicalDamageMod";

let failures = 0;
function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}
function warn(msg: string) {
  failures++;
  console.warn(`  ✗ ${msg}`);
}

async function main() {
  console.log("=== verify-data (PLAN.md 5章) ===");

  // 1. versions.json
  console.log("[1] api/versions.json");
  const version = await getLatestVersion();
  ok(`最新バージョン = ${version}`);

  // 2. item.json の stats フィールド名
  console.log("[2] item.json stats フィールド名");
  const itemFile = await fetchJson<DdragonItemFile>(
    DDRAGON.itemUrl(version, LOCALES.ja),
  );
  const items = Object.values(itemFile.data);
  const hasMagic = items.some((it) => (it.stats?.[MAGIC_FIELD] ?? 0) > 0);
  const hasPhysical = items.some(
    (it) => (it.stats?.[PHYSICAL_FIELD] ?? 0) > 0,
  );
  hasMagic
    ? ok(`${MAGIC_FIELD} > 0 のアイテムあり`)
    : warn(`${MAGIC_FIELD} > 0 のアイテムが見つからない → フィールド名を要確認`);
  hasPhysical
    ? ok(`${PHYSICAL_FIELD} > 0 のアイテムあり`)
    : warn(
        `${PHYSICAL_FIELD} > 0 のアイテムが見つからない → フィールド名を要確認`,
      );

  // 3. champion 総数
  console.log("[3] champion.json 総数");
  const championFile = await fetchJson<DdragonChampionFile>(
    DDRAGON.championUrl(version, LOCALES.ja),
  );
  const count = Object.keys(championFile.data).length;
  if (Math.abs(count - EXPECTED_CHAMPION_COUNT) <= 15) {
    ok(`チャンピオン総数 = ${count}（想定 ${EXPECTED_CHAMPION_COUNT} 前後）`);
  } else {
    warn(
      `チャンピオン総数 = ${count}（想定 ${EXPECTED_CHAMPION_COUNT} と大きく乖離 → PLAN.md 更新）`,
    );
  }

  // 4. 画像 URL パス構造
  console.log("[4] チャンピオン画像 URL");
  const sample = Object.values(championFile.data)[0];
  const imgUrl = DDRAGON.championImgUrl(version, sample.image.full);
  const res = await fetch(imgUrl);
  const ctype = res.headers.get("content-type") ?? "";
  if (res.ok && ctype.startsWith("image/")) {
    ok(`画像取得 OK: ${imgUrl} (${ctype})`);
  } else {
    warn(`画像取得 NG: ${imgUrl} status=${res.status} type=${ctype}`);
  }

  console.log("=== 結果 ===");
  if (failures === 0) {
    console.log("すべての検証項目が想定どおり。");
  } else {
    console.warn(
      `${failures} 件が想定と不一致。PLAN.md を実データに合わせて更新すること。`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[verify] FAILED:", err);
  process.exitCode = 1;
});
