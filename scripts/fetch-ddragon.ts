/**
 * Data Dragon から最新パッチのデータと画像を取得し、リポジトリに同梱する。
 *
 * 生成物:
 *   data/raw/champion.ja_JP.json
 *   data/raw/champion.en_US.json
 *   data/raw/item.ja_JP.json
 *   data/raw/meta.json                 （fetch 時のパッチ・日時）
 *   public/champions/<Champion>.png    （全チャンピオン画像）
 *
 * 実行: npm run fetch:ddragon
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  DDRAGON,
  LOCALES,
  PATHS,
  ensureDir,
  fetchJson,
  getLatestVersion,
  writeJson,
  type DdragonChampionFile,
} from "./lib.js";

async function downloadImage(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

async function main() {
  const version = await getLatestVersion();
  console.log(`[fetch] latest patch = ${version}`);

  await ensureDir(PATHS.rawDir);

  // --- champion.json（ja / en）と item.json（ja）を取得 ---
  console.log("[fetch] champion.json (ja_JP, en_US), item.json (ja_JP) ...");
  const [championJa, championEn, itemJa] = await Promise.all([
    fetchJson<DdragonChampionFile>(DDRAGON.championUrl(version, LOCALES.ja)),
    fetchJson<DdragonChampionFile>(DDRAGON.championUrl(version, LOCALES.en)),
    fetchJson(DDRAGON.itemUrl(version, LOCALES.ja)),
  ]);

  await writeJson(PATHS.rawChampionJa, championJa);
  await writeJson(PATHS.rawChampionEn, championEn);
  await writeJson(PATHS.rawItem, itemJa);
  await writeJson(PATHS.rawMeta, {
    patch: version,
    fetched_at: new Date().toISOString(),
    locales: [LOCALES.ja, LOCALES.en],
  });

  const champions = Object.values(championJa.data);
  console.log(`[fetch] champions = ${champions.length}`);

  // --- チャンピオン画像を一括ダウンロード ---
  await ensureDir(PATHS.championsImgDir);
  let downloaded = 0;
  let skipped = 0;
  // CDN への配慮で軽く直列＋小バッチ。
  const batchSize = 8;
  for (let i = 0; i < champions.length; i += batchSize) {
    const batch = champions.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (c) => {
        const file = c.image.full; // 例: "Teemo.png"
        const dest = path.join(PATHS.championsImgDir, file);
        try {
          await fs.access(dest);
          skipped++;
          return;
        } catch {
          /* 未取得ならDL */
        }
        await downloadImage(DDRAGON.championImgUrl(version, file), dest);
        downloaded++;
      }),
    );
    process.stdout.write(
      `\r[fetch] images ${downloaded + skipped}/${champions.length}`,
    );
  }
  process.stdout.write("\n");
  console.log(`[fetch] images downloaded=${downloaded} skipped=${skipped}`);
  console.log("[fetch] done.");
}

main().catch((err) => {
  console.error("[fetch] FAILED:", err);
  process.exitCode = 1;
});
