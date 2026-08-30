---
name: pre-release-check
description: 公開前に Riot の規約遵守を確認する。サイトを公開する / デプロイする / Twitter で共有する前、あるいは「公開前チェック」を求められたときに使う。表記文の突き合わせ、商標の混入、SHOW_CHAMPION_IMAGES と画像なしビルドの確認まで行う。
---

# 公開前チェック

Twitter で共有する前に全項目を確認する。根拠は `CLAUDE.md`、
アセット同梱の判断は `docs/riot-assets-in-repo.md` にある。
1項目でも落ちたら、直すまで公開しない。

## 機械的に確認できるもの

```sh
grep -rn 'name="keywords"' src/      # 出力が無いこと
grep -n 'title:' src/app/layout.tsx  # title / og:title に商標・チャンピオン名が無いこと
```

画像なしでも遊べること（`CLAUDE.md` グレーゾーン対処の要件）:

1. `src/config.ts` の `SHOW_CHAMPION_IMAGES` を `false` にする
2. `npm run build` が通り、`npm run dev` で出題・正誤判定が最後まで動く
3. `public/champions/` を一時的に退避して `npm run build` が通る
   （`mv public/champions /tmp/champions-backup` → ビルド → 戻す）
4. 変更した `src/config.ts` を元に戻す（`git checkout src/config.ts`）

## 目視で確認するもの

フッターの表記文2種は、公開直前に公式ページを開いて差分がないか突き合わせる。

- Legal Jibber Jabber 第6条: https://www.riotgames.com/en/legal
- Developer General Policies の免責文: https://developer.riotgames.com/policies/general

原文（英語）のままであること。和訳に置き換わっていたら不合格。

## チェックリスト

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
