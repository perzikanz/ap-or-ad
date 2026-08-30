/**
 * Phase 2（正解データの入力）の入力支援 CLI。
 *
 * 人間が統計サイトを見てコアアイテム3個を打ち込むと、
 * ap_ratio と answer を自動計算して data/champions.json を更新する。
 * アイテムは日本語名・英語名・略称・IDのどれでも指定できる。
 * 1チャンピオン確定するたびに保存するので、途中で Ctrl-C しても入力は消えない。
 *
 * 実行:
 *   npm run input:champions              未入力のチャンピオンを順に処理する
 *   npm run input:champions -- --all     入力済みも含めて全チャンピオンを回る
 *   npm run input:champions -- --only アーリ   名前/IDで対象を絞る
 *   npm run input:champions -- --status  進捗と HYBRID 集計だけ表示して終了
 */
import { createInterface } from "node:readline/promises";
import {
  buildChampionsFile,
  loadChampionSources,
  scoreCoreItems,
  writeChampionsFile,
  type ChampionOut,
  type ChampionSources,
  type ChampionsFile,
} from "./champions.js";
import {
  findItems,
  getItem,
  loadItemIndex,
  normalize,
  pickUnambiguous,
  type ItemIndex,
  type ItemInfo,
} from "./item-search.js";

/** 候補が多いときに一度に見せる件数。番号1桁で選べる範囲に収める。 */
const MAX_CANDIDATES = 9;

/** PLAN.md 1.1 が想定するコアアイテム数。ずれても入力は通すが警告する。 */
const EXPECTED_CORE_ITEMS = 3;

const USAGE = `使い方:
  npm run input:champions              未入力のチャンピオンを順に処理する
  npm run input:champions -- --all     入力済みも含めて全チャンピオンを回る
  npm run input:champions -- --only <名前|ID>   対象を絞る
  npm run input:champions -- --status  進捗と HYBRID 集計だけ表示する`;

interface Options {
  all: boolean;
  only: string | null;
  status: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { all: false, only: null, status: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--all") opts.all = true;
    else if (arg === "--status") opts.status = true;
    else if (arg === "--only") opts.only = argv[++i] ?? null;
    else if (arg.startsWith("--only=")) opts.only = arg.slice("--only=".length);
    else {
      console.error(`不明なオプション: ${arg}\n${USAGE}`);
      process.exit(1);
    }
  }
  return opts;
}

/* ---------------- 表示 ---------------- */

const TYPE_LABEL = { AP: "AP", AD: "AD", NONE: "対象外" } as const;

function itemLine(item: ItemInfo): string {
  const en = item.name_en ? ` / ${item.name_en}` : "";
  const flags = [
    `[${TYPE_LABEL[item.type]}]`,
    item.hybrid_stat ? "[魔力+物理]" : "",
    item.mode_specific ? "[モード別]" : "",
    !item.sr ? "[SR外]" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${String(item.id).padStart(6)} ${item.name}${en}  ${flags}`;
}

function printHelp(): void {
  console.log(`
  アイテムは まとめて入力できる。区切りはスペース、カンマがあればカンマ優先。
    例) 3089 3157 3020
    例) ラバドン ゾーニャ ソーサラー
    例) クラーケン スレイヤー, ナッシャー, ブラッドサースター   （名前に空白を含むとき）

  コマンド:
    s   このチャンピオンをスキップして次へ
    b   1つ前のチャンピオンに戻る
    c   このチャンピオンの入力を消す
    q   保存して終了（入力は毎回保存済み）
    ?   このヘルプ
`);
}

function statusOf(c: ChampionOut): string {
  if (c.core_items.length === 0) return "未入力";
  return `${c.answer || "未確定"} (ap_ratio ${c.ap_ratio?.toFixed(2) ?? "-"})`;
}

function printSummary(file: ChampionsFile): void {
  const { champions } = file;
  const filled = champions.filter((c) => c.core_items.length > 0);
  const count = (a: string) => champions.filter((c) => c.answer === a).length;
  const hybrid = champions.filter((c) => c.answer === "HYBRID");

  console.log(`\n=== 進捗（patch ${file.patch}）===`);
  console.log(
    `チャンピオン ${champions.length} / 入力済み ${filled.length} / 未入力 ${
      champions.length - filled.length
    }`,
  );
  console.log(
    `answer: AP ${count("AP")} / AD ${count("AD")} / HYBRID ${hybrid.length} / 未確定 ${count("")}`,
  );
  if (hybrid.length > 0) {
    console.log(`\nHYBRID（通常モードでは出題しない）${hybrid.length} 体:`);
    for (const c of hybrid) {
      console.log(
        `  ${c.name_ja} / ${c.name_en}  ap_ratio ${c.ap_ratio?.toFixed(2) ?? "-"}`,
      );
    }
  }
  if (filled.length === champions.length) {
    console.log("\n全チャンピオンの入力が完了。Phase 2 の完了条件を満たした。");
  }
}

/* ---------------- 入力 ---------------- */

/**
 * 1行読む。EOF・Ctrl-D なら null。
 *
 * rl.question ではなく行キューを自前で持つのは、複数行をまとめて貼り付けたときに
 * 「質問していない間に届いた行」が捨てられるのを防ぐため。
 */
function makeAsk(rl: ReturnType<typeof createInterface>) {
  const queue: string[] = [];
  let pending: ((line: string | null) => void) | null = null;
  let closed = false;

  const deliver = (line: string | null) => {
    const resolve = pending;
    pending = null;
    resolve?.(line);
  };
  rl.on("line", (line) => {
    if (pending) deliver(line.trim());
    else queue.push(line.trim());
  });
  rl.on("close", () => {
    closed = true;
    deliver(null);
  });

  return (prompt: string): Promise<string | null> => {
    const queued = queue.shift();
    if (queued !== undefined) {
      process.stdout.write(prompt + queued + "\n");
      return Promise.resolve(queued);
    }
    if (closed) return Promise.resolve(null);
    rl.setPrompt(prompt);
    rl.prompt();
    return new Promise((resolve) => {
      pending = resolve;
    });
  };
}

type Ask = ReturnType<typeof makeAsk>;

/**
 * 1件ぶんの入力をアイテムに解決する。null は「この行を取り消す」。
 *
 * 見つからない・候補が複数ある場合はその1件だけを聞き直す。
 * 3件目で間違えたときに行ごと打ち直すのは無駄なので。
 */
async function resolveOne(
  input: string,
  index: ItemIndex,
  ask: Ask,
): Promise<ItemInfo | null> {
  let query = input;
  for (;;) {
    if (/^\d+$/.test(query)) {
      const item = getItem(index, Number(query));
      if (item) return item;
      console.log(`  ID ${query} のアイテムが見つからない。`);
    } else {
      const hits = findItems(index, query);
      if (hits.length === 0) {
        console.log(`  "${query}" に一致するアイテムがない。`);
        if (!index.hasEnglishNames && /^[\x20-\x7e]+$/.test(query)) {
          console.log(
            "  （英語名で引くには npm run fetch:ddragon で item.en_US.json を取得しておくこと）",
          );
        }
      } else {
        const unambiguous = pickUnambiguous(hits);
        if (unambiguous) return unambiguous;

        console.log(`  "${query}" の候補:`);
        const shown = hits.slice(0, MAX_CANDIDATES).map((h) => h.item);
        shown.forEach((item, i) => console.log(`   ${i + 1}) ${itemLine(item)}`));
        if (hits.length > shown.length) {
          console.log(`   ... 他 ${hits.length - shown.length} 件`);
        }
        const picked = await ask("  番号か、別の名前を入力（Enter で取り消し）> ");
        if (!picked) return null;
        const n = Number(picked);
        if (Number.isInteger(n) && n >= 1 && n <= shown.length) {
          return shown[n - 1];
        }
        query = picked;
        continue;
      }
    }
    const retry = await ask("  名前かIDを入れ直す（Enter で取り消し）> ");
    if (!retry) return null;
    query = retry;
  }
}

/**
 * 1行ぶんをアイテム配列に解決する。1件でも取り消されたら null。
 *
 * 区切りはカンマ優先。「クラーケン スレイヤー」のように名前に空白を含む指定を
 * 空白区切りだと2件に割ってしまうため、カンマがあればそちらを優先する。
 */
async function resolveLine(
  line: string,
  index: ItemIndex,
  ask: Ask,
): Promise<ItemInfo[] | null> {
  const parts = /[,、]/.test(line) ? line.split(/[,、]+/) : line.split(/\s+/);
  const items: ItemInfo[] = [];
  for (const part of parts.map((p) => p.trim()).filter(Boolean)) {
    const item = await resolveOne(part, index, ask);
    if (!item) return null;
    items.push(item);
  }
  return items;
}

type Action = "next" | "back" | "quit";

async function handleChampion(
  champion: ChampionOut,
  position: string,
  sources: ChampionSources,
  index: ItemIndex,
  ask: Ask,
  save: () => Promise<ChampionsFile>,
): Promise<Action> {
  console.log(
    `\n────────────────────────────────────────\n${position} ${champion.name_ja} / ${champion.name_en}  — ${statusOf(champion)}`,
  );
  if (champion.core_items.length > 0) {
    for (const id of champion.core_items) {
      const item = getItem(index, id);
      console.log(`  現在: ${item ? itemLine(item) : `${id}（不明なID）`}`);
    }
  }

  for (;;) {
    const line = await ask("コアアイテム（? でヘルプ）> ");
    if (line === null || line === "q") return "quit";
    if (line === "") continue;
    if (line === "?" || line === "h") {
      printHelp();
      continue;
    }
    if (line === "s") return "next";
    if (line === "b") return "back";
    if (line === "c") {
      sources.inputs.delete(champion.id);
      await save();
      console.log("  入力を消した。");
      return "next";
    }

    const items = await resolveLine(line, index, ask);
    if (!items || items.length === 0) continue;

    const ids = items.map((i) => i.id);
    const score = scoreCoreItems(ids, sources.classified.items);
    console.log("");
    for (const item of items) console.log(`  ${itemLine(item)}`);
    console.log(
      `  → AP ${score.ap} / AD ${score.ad} / 対象外 ${score.none}` +
        `  ap_ratio ${score.ap_ratio?.toFixed(2) ?? "-"}  ⇒ ${score.answer || "判定不能"}`,
    );

    if (items.length !== EXPECTED_CORE_ITEMS) {
      console.log(
        `  ⚠ コアアイテムは ${EXPECTED_CORE_ITEMS} 個想定（今回 ${items.length} 個）。`,
      );
    }
    if (score.answer === "") {
      console.log(
        "  ⚠ AP/AD アイテムが1つも無いため answer が確定しない。ダメージアイテムを含めること。",
      );
    }
    const hybridStat = items.filter((i) => i.hybrid_stat);
    if (hybridStat.length > 0) {
      console.log(
        `  ⚠ 魔力・物理を両方持つアイテムが ${hybridStat.length} 個あり ap_ratio の分母から外れる（PLAN.md 1.1）。`,
      );
      console.log("     判断根拠をメモに残すこと。");
    }

    const current = champion.note;
    const note = await ask(
      current
        ? `メモ [現在: ${current}]（Enter で維持 / - で削除）> `
        : "メモ（任意, Enter でスキップ）> ",
    );
    if (note === null) return "quit";
    const nextNote = note === "-" ? undefined : note || current;

    sources.inputs.set(champion.id, {
      core_items: ids,
      ...(nextNote ? { note: nextNote } : {}),
    });
    await save();
    console.log("  保存した。");
    return "next";
  }
}

/* ---------------- エントリポイント ---------------- */

function selectTargets(
  champions: ChampionOut[],
  opts: Options,
): ChampionOut[] {
  if (opts.only) {
    const q = normalize(opts.only);
    return champions.filter((c) =>
      [c.id, c.name_ja, c.name_en].some((s) => normalize(s).includes(q)),
    );
  }
  if (opts.all) return champions;
  return champions.filter((c) => c.core_items.length === 0);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const sources = await loadChampionSources();
  const index = await loadItemIndex(sources.classified);
  let file = buildChampionsFile(sources);

  if (opts.status) {
    printSummary(file);
    return;
  }

  const targets = selectTargets(file.champions, opts);
  if (targets.length === 0) {
    console.log(
      opts.only
        ? `"${opts.only}" に一致するチャンピオンがいない。`
        : "未入力のチャンピオンはいない。--all で入力済みも見直せる。",
    );
    printSummary(file);
    return;
  }

  console.log(`patch ${file.patch} / 対象 ${targets.length} 体`);
  if (!index.hasEnglishNames) {
    console.log(
      "英語名での検索は無効（data/raw/item.en_US.json が無い。npm run fetch:ddragon で取得できる）。",
    );
  }
  printHelp();

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = makeAsk(rl);
  const save = async () => {
    file = buildChampionsFile(sources);
    await writeChampionsFile(file);
    return file;
  };

  try {
    let i = 0;
    while (i < targets.length) {
      // targets は入力前のスナップショットなので、保存済みの最新値を引き直す。
      const id = targets[i].id;
      const champion =
        file.champions.find((c) => c.id === id) ?? targets[i];
      const action = await handleChampion(
        champion,
        `[${i + 1}/${targets.length}]`,
        sources,
        index,
        ask,
        save,
      );
      if (action === "quit") break;
      if (action === "back") i = Math.max(0, i - 1);
      else i++;
    }
  } finally {
    rl.close();
  }

  printSummary(file);
}

main().catch((err) => {
  console.error("[input] FAILED:", err);
  process.exitCode = 1;
});
