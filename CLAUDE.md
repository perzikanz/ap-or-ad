# CLAUDE.md — 遵守事項

このプロジェクトは **Riot Games の IP を利用するファンプロジェクト**です。
Riot の "Legal Jibber Jabber" ポリシーの制約下にあるため、以下は**技術的な好みではなく制約**として扱ってください。

詳細な開発計画は `PLAN.md` を参照。

このファイルには **Riot の規約に由来する制約**だけを置く。
開発作業のルールは `.claude/rules/` 以下に分けてあり、変更するときもそちら側を直す。

| ファイル | 内容 | 読み込まれ方 |
| --- | --- | --- |
| `.claude/rules/git.md` | コミット / PR の粒度、リポジトリに残す文面の禁止事項 | 毎セッション |
| `.claude/rules/code-style.md` | コメントの粒度などコードの書き方 | `src/` `scripts/` のコードを開いたときだけ |

---

## 🚫 絶対にやってはいけないこと

### 1. Riot の商標・キャラクター名を識別子に使わない

Legal Jibber Jabber 第5条により、**Riot Games および同社の商標・商号・キャラクター名を含む
ドメイン名やソーシャルメディアアカウントの登録が禁止**されています。
また、商標やIP関連の名称を**キーワードや検索タグとして使うことも禁止**されています。

したがって以下はすべて NG:

- ドメイン / サブドメイン名（`lol-quiz`, `league-quiz`, `teemo-*` など）
- リポジトリ名
- `<title>` タグ、OGP の `og:title`
- `<meta name="keywords">`（そもそも設置しない）
- npm パッケージ名

サイト名は `AP or AD` のような、ゲーム内の一般的な略語のみで構成すること。
ゲーム名は本文中で「これは League of Legends のファンプロジェクトです」と説明する範囲に留める。

### 2. Riot のロゴ・トレードマークを使わない

サイト内、favicon、OGP 画像、README、どこにも使わない。
使ってよいのは Data Dragon が配信するチャンピオンのアイコン画像のみ。

### 3. 収益化しない

Legal Jibber Jabber は非商用利用に限定してライセンスを付与しており、ペイウォール・
クラウドファンディング・法人関与を禁じています（広告のみ例外的に許可）。

加えて **Vercel Hobby プランは非商用の個人利用に限定**されているため、
Riot 側が例外として認めている広告も **Vercel 側の規約違反になります**。

結論: **広告・アフィリエイト・投げ銭・課金を一切実装しない。**

### 4. 統計サイトをスクレイピングしない

OP.GG / U.GG / LoLalytics 等への自動アクセスは行わない。
ビルド統計は人間が目視で入力するか、Riot 公式 API から自前で集計する（`PLAN.md` Phase 5）。

### 5. 暗号通貨・ブロックチェーン・NFT 要素を一切入れない

Riot の Developer General Policies で明確に禁止されています。

---

## ✅ 必ずやること

### 帰属表示 — **2種類**を掲載する

Riot の規約は**別々の文書で別々の表記文**を要求しており、両方が必要です。
どちらもサイトのフッターなど**目立つ場所に**掲載すること。

**(1) Legal Jibber Jabber 第6条**（ファンプロジェクト全般に必須）

出典 https://www.riotgames.com/en/legal 第6条（2026-08-27 取得）:

> [The title of your Project] was created under Riot Games' "Legal Jibber Jabber" policy
> using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.

`[The title of your Project]` を `AP or AD` に置換して使う。

**(2) Developer General Policies の免責文**（API キーを使う製品に必須）

出典 https://developer.riotgames.com/policies/general （2026-08-27 取得）。
"Products must display the following disclaimer in a readily visible location":

> [Your product] isn't endorsed by Riot Games and doesn't reflect the views or opinions of
> Riot Games or anyone officially involved in producing or managing Riot Games properties.
> Riot Games, and all associated properties are trademarks or registered trademarks of
> Riot Games, Inc.

`[Your product]` を `AP or AD` に置換して使う。
これは Personal API key を取得した時点で拘束されるため（`PLAN.md` Phase 5）、
**最初から両方載せておく**。後から足す運用にすると載せ忘れる。

⚠ どちらも**原文（英語）のまま**掲載すること。和訳を掲げると「指定された表記文を掲載した」
とは言えなくなる。日本語の説明を添えるのは自由だが、指定文の置き換えにはしない。
上記は取得日時点の写しなので、公開直前に公式ページを開いて差分がないか目視すること。

### パッチバージョンの明記

「このデータはパッチ X.Y 時点のものです」とフッターに表示する。
データが古くなったときの説明になるため。

---

## ⚠ 判断が必要なグレーゾーン

Legal Jibber Jabber 第3条は「**ゲームおよびアプリへの IP の使用を禁止**」しており、
キャラクターの外見・アビリティ・アイコン等を game や app に使わないよう求めています。
続く明確化は App Store / Google Play を対象としており、Web サイトが同じ扱いかは原文からは断定できません。

対処方針（開発者が決定済み）:

1. **Riot Personal API key を取得しておく。** 第3条の例外は「書面ライセンス **または**
   有効な API キー＋API規約遵守」の二択であり、Personal API key は無料・検証プロセスなしで
   取得できるため。`PLAN.md` Phase 5 で実際に使う予定なので名目上のものにならない。
2. リスクをさらに下げる選択肢として、**チャンピオン画像を使わず名前テキストのみで出題する**
   モードを実装可能にしておく。`src/config.ts` に `SHOW_CHAMPION_IMAGES` フラグを置き、
   画像なしでも UI が破綻しない設計にすること。

**このフラグは必ず実装してください。** 後から画像を外せる状態を保つためのものです。

---

## リポジトリ同梱の可否

**結論: Data Dragon の JSON と チャンピオンアイコンを public リポジトリに含めてよい。**
ただし下記の条件を守ること。判断の根拠と調査時点の同梱物一覧は
`docs/riot-assets-in-repo.md`（2026-08-27 調査）。

- **アセットにオープンソースライセンスを被せない。**
  Legal Jibber Jabber のライセンスは "non-exclusive, **non-sublicenseable, non-transferable,
  revocable**"。再許諾できない以上、MIT 等を付けると与えられていない権利を第三者に渡すことになる。
  現状このリポジトリに `LICENSE` は無い。**追加する場合は自作コードのみを対象とし、
  `public/champions/` と `data/raw/` を明示的に除外する**こと。
- **アセット置き場としてのリポジトリにしない。**
  ライセンスされているのは「プロジェクトの中でアセットを使うこと」。
  ddragon を丸ごとミラーする、アセットを npm パッケージや Release 成果物として切り出して
  配る、といった「単体で再配布する」形にはしない。
- **画像はチャンピオンアイコンのみ。**
  dragontail にはスプラッシュアート・ローディング画面・スキル/アイテムアイコンも入っているが、
  同梱するのは `public/champions/` のチャンピオンアイコンだけ（既存ルールどおり）。
- **いつでも剥がせる状態を保つ。** ライセンスは revocable。
  `public/champions/` を丸ごと削除しても `SHOW_CHAMPION_IMAGES = false` でビルド・デプロイが
  通ることを担保する。これが同フラグのもう一つの存在理由。
- **Match-V5 で取得した生データはコミットしない**（`PLAN.md` Phase 5）。
  API 規約は終了時に "delete all of the Game Information in Your possession" を求めており、
  public リポジトリの履歴に入れると事実上削除できなくなる。
  コミットしてよいのは集計後の `ap_ratio` / `core_items` のみ。
  Data Dragon は API キー不要の公開 CDN なのでこの条項の射程外だが、Match-V5 は完全に射程内。

---

## 公開前チェックリスト

Twitter で共有する前に全項目を確認すること。

- [ ] サイト名・URL・リポジトリ名に Riot の商標／チャンピオン名を含んでいない
- [ ] Riot のロゴを使っていない（サイト内・favicon・OGP画像すべて）
- [ ] Legal Jibber Jabber 第6条の表記文をフッターに原文のまま掲載した
- [ ] Developer General Policies の免責文もフッターに原文のまま掲載した
- [ ] 上記2文を公開直前に公式ページと突き合わせて差分がないことを確認した
- [ ] `<meta name="keywords">` を設置していない
- [ ] 広告・課金・投げ銭・アフィリエイトが一切ない
- [ ] Personal API key を申請済み
- [ ] LoL 専用の Twitter アカウントを新規作成していない（個人アカウントから投稿する）
- [ ] データのパッチバージョンをサイト上に明記した
- [ ] `SHOW_CHAMPION_IMAGES` フラグが機能し、`false` でも遊べる
- [ ] `public/champions/` を削除した状態でもビルドが通る
- [ ] `LICENSE` を置くなら Riot アセット（`public/champions/`・`data/raw/`）を除外している
- [ ] Vercel は Hobby プランのまま（Pro に上げる必要はない）

---

## 実装上の約束事

- **正解ラベルに `champion.json` の `info.attack` / `info.magic` / `tags` を使わない。**
  Data Dragon のこれらの値は不正確であり、「主なダメージ源」を表す値でもない。
  正解は必ず `PLAN.md` に定義された ap_ratio の計算で決めること。
- 実行時に Riot の CDN を叩かない。データも画像もビルド時に取得してリポジトリに含める。
- 外部の有料サービスを導入しない。DB もサーバーも不要（`localStorage` で足りる）。
- `PLAN.md` の「検証タスク」を実装前に必ず実行し、想定と実データが違えば `PLAN.md` を更新する。
