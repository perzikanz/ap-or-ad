# AP or AD

チャンピオンの主なダメージ源が **AP か AD か** を当てる 2 択クイズです。
これは *League of Legends* の非公式ファンプロジェクトであり、Riot Games の許諾を受けていません。

> **重要:** 開発の禁止事項・遵守事項は [`CLAUDE.md`](./CLAUDE.md) に、
> 詳細な設計と開発計画は [`PLAN.md`](./PLAN.md) にあります。作業前に必ず読んでください。

---

## 特徴

- 正解ラベルは **見た目やクラスタグではなく、実際のビルド統計**（コアアイテムの AP/AD 比率）で機械的に決める。
- AP でも AD でもない両ビルド成立チャンプは `HYBRID` として通常モードから除外し、根拠を数字（`ap_ratio`）で示す。
- 完全非公式・非商用。広告・課金・投げ銭は一切なし。
- 静的サイト（`output: 'export'`）。サーバー・DB 不要。スコア履歴は `localStorage`。

## 技術スタック

- Next.js (App Router) + TypeScript
- 静的エクスポート（`next.config.ts` の `output: 'export'`）
- Tailwind CSS
- デプロイ: Vercel Hobby プラン（無料）

## セットアップ

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 静的ビルド -> out/
```

`out/` を任意の静的ホストに配置すれば動きます。Vercel は GitHub 連携で push すると自動デプロイされます。

## データパイプライン（PLAN.md Phase 1）

チャンピオンデータと画像は **ビルド時に取得してリポジトリに同梱** します（実行時に Riot の CDN を叩きません）。
Data Dragon に接続できる環境で以下を実行してください。

```bash
npm run fetch:ddragon    # 最新バージョン取得 -> champion.json / item.json を data/raw/ に保存
npm run classify:items   # アイテムを AP/AD/NONE に分類 -> data/items-classified.json
npm run build:champions  # 出題データ雛形を生成 -> data/champions.json
npm run verify:data      # 検証タスク（PLAN.md 5章）を実行してログ出力
# まとめて:
npm run data:all
```

生成後、`data/champions.json` の各チャンピオンに `core_items` を人間が入力し、
`build:champions` を再実行すると `ap_ratio` と `answer` が自動計算されます（Phase 2）。

> ⚠ `data/champions.json` が空（雛形のまま）でもトップページはビルド・表示できます。
> データ未生成の状態が UI に明示されます。

## 設定（`src/config.ts`）

| 設定                   | 意味                                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| `SHOW_CHAMPION_IMAGES` | チャンピオン画像を表示するか。`false` にすると名前テキストのみで出題する。 |
| `THRESHOLDS`           | AP/AD 判定のしきい値（`ap: 0.7`, `ad: 0.3`）。                             |
| `QUESTIONS_PER_SET`    | 1 セットの出題数。                                                          |

`SHOW_CHAMPION_IMAGES` は法的リスクを下げるためのフラグで、`false` でも UI が破綻しない設計です（CLAUDE.md）。

## 法的事項

- 使用してよい画像は Data Dragon が配信するチャンピオンアイコンのみ。Riot のロゴ・トレードマークは使いません。
- サイト名・リポジトリ名・ドメインに Riot の商標／チャンピオン名を含めません。
- フッターに Riot の "Legal Jibber Jabber" 第6条の帰属表示を掲載します。
  **本文は公式サイト（https://www.riotgames.com/en/legal 第6条）から逐語でコピーし、
  `[The title of your Project]` を「AP or AD」に置換すること。** 記憶や推測で書かないこと。
  （現状フッターは暫定文言のプレースホルダーです。公開前に差し替えてください。）
- フッターにデータのパッチバージョンを明記します。

公開前チェックリストは [`CLAUDE.md`](./CLAUDE.md) を参照。
