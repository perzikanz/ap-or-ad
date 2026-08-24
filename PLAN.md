# AP or AD — 開発計画書

League of Legends のチャンピオンの主なダメージ源が AP か AD かを当てるクイズサイト。

このドキュメントは Claude Code への引き継ぎ用です。会話の文脈なしで読める形で書かれています。
実装上の禁止事項・遵守事項は `CLAUDE.md` に分離してあるので、作業前に必ずそちらも読んでください。

---

## 0. プロジェクトの前提

| 項目           | 決定内容                                             |
| -------------- | ---------------------------------------------------- |
| 想定利用者     | 5人程度（Twitter で身内に共有）                      |
| 商用性         | 完全に非商用。広告・課金・投げ銭すべてなし           |
| ホスティング   | Vercel Hobby プラン（無料）                          |
| ドメイン       | 独自ドメインは買わない。`ap-or-ad.vercel.app` を想定 |
| 予算           | 0円。有料サービスは一切使わない                      |
| 開発者のスキル | Vercel へのデプロイ経験あり                          |

---

## 1. 決定済みの設計方針

### 1.1 「正解」の決め方 — 統計ベース

チャンピオンの AP / AD 判定は、**実際のランクマッチにおけるビルド傾向**から機械的に決める。
チャンピオンの見た目やクラスタグからの主観判断はしない。

判定手順:

1. Data Dragon の `item.json` から、各アイテムを AP / AD / どちらでもない に分類する
   - `stats.FlatMagicDamageMod > 0` かつ `FlatPhysicalDamageMod == 0` → AP アイテム
   - `stats.FlatPhysicalDamageMod > 0` かつ `FlatMagicDamageMod == 0` → AD アイテム
   - 両方 0（タンク装備・ブーツ等）→ ノーカウント（NONE）
   - 両方 > 0（魔力・物理の両方を持つ稀なアイテム）→ ノーカウント（NONE）扱いとし、
     分類スクリプトで警告ログを出す。AP/AD どちらか一方に寄せると偏るため、
     ap_ratio の計算からは除外する（該当が出た場合は目視で要確認）。
   - ※ フィールド名は実データで要検証（後述の「検証タスク」参照）
2. 各チャンピオンについて、統計上の主要ビルド（コアアイテム3個）を特定する
3. スコアを計算する

   ```
   ap_ratio = APアイテム数 / (APアイテム数 + ADアイテム数)
   ```

4. 閾値でラベリングする

   | ap_ratio | answer   |
   | -------- | -------- |
   | >= 0.7   | `AP`     |
   | <= 0.3   | `AD`     |
   | それ以外 | `HYBRID` |

閾値は設定ファイルで変更可能にすること。実データを見てから調整する前提。

### 1.2 ハイブリッドの扱い

`HYBRID` 判定されたチャンピオンは **データとしては保持し、通常モードでは出題しない**。
別途「魔境モード」を用意し、そこでのみ出題する。

理由: 2択クイズで Kayle や Ezreal のような両ビルド成立チャンプを出すと理不尽になる。
統計ベースなら「ap_ratio 0.48 なのでハイブリッド判定」と数字で除外根拠を示せる。

想定該当数は 10〜20 体程度（未検証の見積もり）。

### 1.3 データ取得ルート

**Phase 2 では手入力**、Phase 5 で自動化する。

| ルート                            | 採否               | 備考                                                       |
| --------------------------------- | ------------------ | ---------------------------------------------------------- |
| 統計サイトを目視して手入力        | **Phase 2 で採用** | 172体で実働2〜3時間。スクレイパーを書くのと大差ない        |
| 統計サイトの自動スクレイピング    | **不採用**         | 各サイトの利用規約に抵触するリスク。サイト構造変更で壊れる |
| Riot 公式 Match-V5 API で自前集計 | **Phase 5 で採用** | 規約上もっともクリーン                                     |

補足: OP.GG / U.GG / LoLalytics などの統計サイトは、いずれも Riot の開発者向け API で
データを取得しているため、元の数値は基本的に同じ。どのサイトを見るかは好みの問題。

---

## 2. 技術スタック

- **Next.js (App Router) + TypeScript**
- **静的エクスポート**（`output: 'export'`）— サーバーサイド処理を持たない
- **Tailwind CSS**
- 状態管理はライブラリ不要。React の `useState` / `useReducer` で足りる
- スコア履歴は `localStorage`（サーバー・DB は使わない）
- デプロイ: Vercel（GitHub 連携で push → 自動デプロイ）

**重要**: チャンピオンデータと画像は **ビルド時に取得してリポジトリに同梱する**。
実行時に Riot の CDN を叩かない。理由は表示速度と、外部 CDN への依存を減らすため。

---

## 3. リポジトリ構成（案）

```
ap-or-ad/
├── CLAUDE.md                  # 遵守事項（必読）
├── PLAN.md                    # 本ファイル
├── README.md
├── package.json
├── next.config.ts
├── data/
│   ├── champions.json         # 生成物: 出題データ（正解ラベル入り）
│   ├── items-classified.json  # 生成物: アイテムのAP/AD分類
│   └── raw/                   # Data Dragon から取得した生JSON
├── scripts/
│   ├── fetch-ddragon.ts       # Data Dragon 取得
│   ├── classify-items.ts      # アイテム分類
│   ├── build-champions.ts     # 正解ラベル生成
│   └── verify-data.ts         # データ整合性チェック
├── public/
│   └── champions/             # チャンピオン画像（ビルド時にDL）
├── src/
│   ├── app/
│   │   ├── page.tsx           # トップ / モード選択
│   │   ├── quiz/page.tsx      # 出題画面
│   │   └── result/page.tsx    # 結果画面
│   ├── components/
│   ├── lib/
│   │   ├── quiz.ts            # 出題ロジック
│   │   └── share.ts           # シェアテキスト生成
│   └── config.ts              # 閾値・フラグ類
└── .env.local.example
```

---

## 4. データスキーマ

### `data/champions.json`

```jsonc
{
  "patch": "16.16.1",
  "generated_at": "2026-08-21",
  "source": "lolalytics / emerald+ / patch 16.16",
  "thresholds": { "ap": 0.7, "ad": 0.3 },
  "champions": [
    {
      "id": "Teemo", // Data Dragon の key
      "name_ja": "ティーモ",
      "name_en": "Teemo",
      "image": "Teemo.png", // public/champions/ 配下のファイル名
      "answer": "AP", // "AP" | "AD" | "HYBRID"
      "ap_ratio": 0.92,
      "core_items": [3115, 3089, 4645], // アイテムID
      "note": "Eの追加ダメージとRの毒がAP係数", // 任意
      "excluded": false, // 通常モードから除外するか
    },
  ],
}
```

`ap_ratio` は結果画面で「このチャンプは92%がAPビルド」と根拠表示に使うので必ず保持すること。
これが統計ベースを選んだ最大のメリットなので、UI に出す。

### `data/items-classified.json`

```jsonc
{
  "patch": "16.16.1",
  "items": {
    "3089": { "name": "ラバドン・デスキャップ", "type": "AP" },
    "3031": { "name": "インフィニティ・エッジ", "type": "AD" },
    "3047": { "name": "プレートスチールキャップ", "type": "NONE" },
  },
}
```

---

## 5. Data Dragon の使い方

すべて認証不要・無料の静的 CDN。CORS 有効。

| 用途               | URL                                                                       |
| ------------------ | ------------------------------------------------------------------------- |
| 最新バージョン一覧 | `https://ddragon.leagueoflegends.com/api/versions.json`                   |
| チャンピオン一覧   | `https://ddragon.leagueoflegends.com/cdn/{VER}/data/ja_JP/champion.json`  |
| アイテム一覧       | `https://ddragon.leagueoflegends.com/cdn/{VER}/data/ja_JP/item.json`      |
| チャンピオン画像   | `https://ddragon.leagueoflegends.com/cdn/{VER}/img/champion/{image.full}` |

`champion.json` の各エントリには `id` / `key` / `name` / `title` / `info` / `image` / `tags` /
`partype` / `stats` が含まれる。

### ⚠ 注意点（コミュニティで広く知られている事実）

- **Data Dragon のデータは不正確。特にチャンピオンのスペルデータは数値が誤っていることが多い。**
  したがって `info.attack` / `info.magic`（0〜10の値）は正解ラベルに **絶対に使わない**。
  これらは「主なダメージ源」を表す値ではない。
- `tags`（Mage / Marksman 等）も正解ラベルには使わない。Teemo が `Marksman` タグで AP依存、
  というような不一致が多数ある。
- パッチ配信と ddragon の更新には最大2日程度のズレが生じることがある。
- 日本語ロケールは `ja_JP`。

### 検証タスク（実装前に必ず実行）

以下は会話時点で未検証。Claude Code は実装前に実データを取得して確認すること。

1. `api/versions.json` が現在も生きているか、最新バージョン文字列は何か
2. `item.json` の stats フィールド名が `FlatMagicDamageMod` / `FlatPhysicalDamageMod` で正しいか
3. `champion.json` のチャンピオン総数（172体前後の想定）
4. 画像 URL のパス構造が上記で正しいか

検証結果は `scripts/verify-data.ts` の出力としてログに残し、想定と違えば本ファイルを更新すること。

---

## 6. 開発フェーズ

### Phase 0: リポジトリ整備（30分）

- [x] GitHub にリポジトリ作成（`ap-or-ad`、public）
- [ ] Next.js + TypeScript + Tailwind の雛形を作成
- [x] `CLAUDE.md` / `PLAN.md` / `README.md` を配置
- [x] `.gitignore` 設定（`node_modules`, `.next`, `.env.local`）
- [ ] Vercel に接続してデプロイが通ることを確認（中身は空でよい）

**完了条件**: `https://ap-or-ad.vercel.app` が 200 を返す

### Phase 1: データ基盤（2〜3時間）

- [ ] 上記「検証タスク」を実行し、結果を記録
- [ ] `scripts/fetch-ddragon.ts`: 最新バージョン取得 → champion.json / item.json を `data/raw/` に保存
- [ ] `scripts/classify-items.ts`: アイテムを AP/AD/NONE に分類し `items-classified.json` を生成
- [ ] チャンピオン画像を `public/champions/` に一括ダウンロード
- [ ] `data/champions.json` の雛形を生成（`answer` と `core_items` は空欄）

**完了条件**: 全チャンピオン分の空欄付き JSON と、アイテム分類テーブルが揃っている

### Phase 2: 正解データの入力（人間の作業、実働2〜3時間）

これは Claude Code ではなく開発者本人がやる作業。
Claude Code は**入力を楽にするツール**を用意する。

- [ ] `scripts/build-champions.ts`: `core_items` を入力すると `ap_ratio` と `answer` を
      自動計算して `champions.json` を更新するスクリプト
- [ ] 入力補助（CLI でもよいし、ローカル用の簡易 Web UI でもよい）
- [ ] 全チャンピオン入力後、`HYBRID` の該当数を集計して報告

**完了条件**: 全チャンピオンに `answer` が入り、`HYBRID` が何体かわかっている

### Phase 3: MVP（2〜3日）

- [ ] トップ画面（モード選択）
- [ ] 出題画面: チャンピオン画像＋名前 → AP / AD の2ボタン → 即座に正誤表示 → 次へ
- [ ] 10問1セット、最後にスコア表示
- [ ] `HYBRID` は通常モードで出題しない
- [ ] スマホ最適化（**利用者はほぼスマホで遊ぶ前提**。片手で押せるボタン配置にすること）

**完了条件**: スマホで10問通して遊べる

### Phase 4: 身内に出せる状態にする（1〜2日）

- [ ] 結果画面に `ap_ratio` を表示（「92%がAPビルド」）
- [ ] シェアテキスト生成（Wordle 風の絵文字グリッド）。Twitter 投稿画面を開くリンク
- [ ] 魔境モード（`HYBRID` のみ出題、3択にする）
- [ ] 難易度モード（人気チャンプのみ / 全チャンプ）
- [ ] `localStorage` に自己ベスト保存
- [ ] **`CLAUDE.md` の公開前チェックリストを全項目確認**

**完了条件**: チェックリストが全項目クリアされている

### Phase 5: データ更新の自動化（任意・後回し可）

- [ ] Riot Developer Portal で Personal API key を申請
- [ ] `scripts/collect-matches.ts`: Match-V5 から試合データを収集
- [ ] 収集した試合の最終ビルドから `ap_ratio` を自前計算し `champions.json` を更新

Riot API のレート制限に関する事実:

- 開発用キーは **1秒あたり20コール / 2分あたり100コール**、**24時間で失効**する
- Personal API key は「開発者本人または小規模なプライベートコミュニティ向け」の製品が対象で、
  検証プロセスなしで登録できる。ただしレート制限の引き上げは承認されない

見積もり（未検証の試算）: 1チャンピオンあたり50試合 × 172体 = 約8,600試合。
2分100コール制限がボトルネックとなり **約3時間のバッチ処理**。一晩放置すれば完了する規模。

---

## 7. UI/UX メモ

- 1問あたりの操作は**タップ1回**で完結させる。「決定」ボタンを挟まない
- 正誤表示は 0.5〜1秒程度で自動的に次へ進むか、タップで進む。待たせない
- 制限時間は Phase 3 では入れない。まず素の状態で遊んでもらってから判断する
- 結果画面で「間違えたチャンピオン一覧」を出す。これが学習価値になる
- ダークテーマ推奨（LoL プレイヤーの視聴環境に馴染む）

---

## 8. 参考リンク

- Riot Legal Jibber Jabber: https://www.riotgames.com/en/legal
- Riot Developer Portal: https://developer.riotgames.com/
- Data Dragon ドキュメント: https://developer.riotgames.com/docs/lol
- コミュニティ製 Data Dragon 解説: https://riot-api-libraries.readthedocs.io/en/latest/ddragon.html
- Vercel 料金: https://vercel.com/pricing
