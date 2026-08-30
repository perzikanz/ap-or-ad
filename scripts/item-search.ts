/**
 * アイテムを名前で引くための検索インデックス。
 *
 * Phase 2 の入力作業では、統計サイトに並んだアイテムを人間が見て打ち込む。
 * アイテムIDを覚えている人はいないので、日本語名・英語名・略称のどれでも引けるようにする。
 *
 * 検索キーの出どころ:
 *   - data/raw/item.ja_JP.json の name と colloq（"Rabadon's Deathcap;dc;ぼうし" のような別名列）
 *   - data/raw/item.en_US.json の name（あれば。colloq が空のアイテムが4割ほどあるため必要）
 */
import {
  PATHS,
  readJsonIfExists,
  type DdragonItemFile,
} from "./lib.js";
import type { ClassifiedItems, ItemType } from "./champions.js";

/** サモナーズリフトのマップID。 */
const SUMMONERS_RIFT = "11";

/**
 * アリーナ・URF 等のモード別に複製されたアイテムのID下限。
 * 本体（3087）と重複エントリ（223087）が同名で並ぶため、検索順で本体を優先する。
 */
const MODE_SPECIFIC_ID_MIN = 200000;

export interface ItemInfo {
  id: number;
  name: string;
  name_en?: string;
  type: ItemType;
  /** 魔力と物理を両方持ち、ap_ratio の分母から外れるアイテム（PLAN.md 1.1）。 */
  hybrid_stat: boolean;
  /** サモナーズリフトで購入できるか。 */
  sr: boolean;
  /** 上位アイテムを持たない＝完成品か。 */
  completed: boolean;
  mode_specific: boolean;
  /** 正規化済みの表示名（日本語名・英語名）。 */
  names: string[];
  /** 正規化済みの別名（colloq 由来の略称・かな読みなど）。 */
  aliases: string[];
}

export interface ItemIndex {
  byId: Map<number, ItemInfo>;
  all: ItemInfo[];
  /** item.en_US.json を読めたか。false なら英語名では引けない。 */
  hasEnglishNames: boolean;
}

/**
 * 表記ゆれを吸収する。ひらがな→カタカナ、大文字→小文字、
 * 区切り記号（空白・中黒・アポストロフィ等）の除去を行う。
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) + 0x60),
    )
    .replace(/[\s　・:：'’`.,\-—ー_]/g, "");
}

function normalizeAll(values: (string | undefined)[]): string[] {
  const keys = new Set<string>();
  for (const v of values) {
    const k = v ? normalize(v) : "";
    if (k) keys.add(k);
  }
  return [...keys];
}

export async function loadItemIndex(
  classified: ClassifiedItems,
): Promise<ItemIndex> {
  const jaFile = await readJsonIfExists<DdragonItemFile>(PATHS.rawItemJa);
  if (!jaFile) {
    throw new Error(
      `${PATHS.rawItemJa} がありません。先に npm run fetch:ddragon を実行してください。`,
    );
  }
  const enFile = await readJsonIfExists<DdragonItemFile>(PATHS.rawItemEn);

  const byId = new Map<number, ItemInfo>();
  for (const [id, ja] of Object.entries(jaFile.data)) {
    const stats = ja.stats ?? {};
    const info: ItemInfo = {
      id: Number(id),
      name: ja.name,
      ...(enFile?.data[id] ? { name_en: enFile.data[id].name } : {}),
      type: classified.items[id]?.type ?? "NONE",
      hybrid_stat:
        (stats.FlatMagicDamageMod ?? 0) > 0 &&
        (stats.FlatPhysicalDamageMod ?? 0) > 0,
      sr: ja.maps?.[SUMMONERS_RIFT] === true && ja.gold?.purchasable === true,
      completed: (ja.into ?? []).length === 0,
      mode_specific: Number(id) >= MODE_SPECIFIC_ID_MIN,
      names: normalizeAll([ja.name, enFile?.data[id]?.name]),
      aliases: normalizeAll((ja.colloq ?? "").split(";")),
    };
    byId.set(info.id, info);
  }

  return {
    byId,
    all: [...byId.values()],
    hasEnglishNames: enFile !== null,
  };
}

/**
 * 一致の強さ。完全一致 > 前方一致 > 部分一致 の順。
 * 別名（colloq）での一致は表示名での一致より一段弱く扱う。
 * 「ブラック」がアイテム名の頭にある ブラック クリーバー より、
 * 別名に "black spear" を持つ別アイテムが上に来るのを防ぐため。
 */
const MATCH = {
  name: { exact: 100, prefix: 60, partial: 30 },
  alias: { exact: 90, prefix: 50, partial: 25 },
} as const;

/** これ未満の一致しかないものは、単独首位でも人間に確認する。 */
const CONFIDENT_MATCH = MATCH.alias.prefix;

export interface ItemHit {
  item: ItemInfo;
  score: number;
}

function bestOf(
  keys: string[],
  query: string,
  weight: { exact: number; prefix: number; partial: number },
): number {
  let best = 0;
  for (const key of keys) {
    if (key === query) best = Math.max(best, weight.exact);
    else if (key.startsWith(query)) best = Math.max(best, weight.prefix);
    else if (key.includes(query)) best = Math.max(best, weight.partial);
  }
  return best;
}

/**
 * 一致の強さを返す（0 は不一致）。
 * 同点は「SRで買える完成品の本体ID」を上に出すための加点をする。
 */
function matchScore(item: ItemInfo, query: string): number {
  let best = Math.max(
    bestOf(item.names, query, MATCH.name),
    bestOf(item.aliases, query, MATCH.alias),
  );
  if (best === 0) return 0;
  if (item.sr) best += 8;
  if (!item.mode_specific) best += 6;
  if (item.completed) best += 4;
  return best;
}

function search(items: ItemInfo[], q: string): ItemHit[] {
  const hits: ItemHit[] = [];
  for (const item of items) {
    const score = matchScore(item, q);
    if (score > 0) hits.push({ item, score });
  }
  hits.sort((a, b) => b.score - a.score || a.item.id - b.item.id);
  return hits;
}

/**
 * query に一致するアイテムを、それらしい順に返す。
 *
 * まずサモナーズリフトで買える本体アイテムだけを探す。
 * ddragon にはアリーナ等モード別の同名複製が大量に入っており、
 * これを混ぜると「ルーデン エコー」が毎回2択になって入力が止まるため。
 * 該当が無いときだけ全アイテムに広げる。
 */
export function findItems(index: ItemIndex, query: string): ItemHit[] {
  const q = normalize(query);
  if (!q) return [];
  const primary = search(
    index.all.filter((i) => i.sr && !i.mode_specific),
    q,
  );
  return primary.length > 0 ? primary : search(index.all, q);
}

/** 数値IDで直接引く。 */
export function getItem(index: ItemIndex, id: number): ItemInfo | undefined {
  return index.byId.get(id);
}

/**
 * 候補を出さずに確定してよい1件を返す。無ければ null。
 *
 * 「ゾーニャ」で ゾーニャの砂時計 と、colloq にその名を含む素材アイテムが並ぶような場合に、
 * 一致の強さが単独首位ならそれを採る。打鍵を減らすのが目的なので、
 * 同点首位が複数ある（＝どちらとも言えない）ときだけ人間に選ばせる。
 */
export function pickUnambiguous(hits: ItemHit[]): ItemInfo | null {
  if (hits.length === 0) return null;
  if (hits.length === 1) return hits[0].item;
  const [top, second] = hits;
  if (top.score >= CONFIDENT_MATCH && top.score > second.score) return top.item;
  return null;
}
