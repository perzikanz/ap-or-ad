# リポジトリ同梱の可否（2026-08-27 調査）

**結論: Data Dragon の JSON と チャンピオンアイコンを public リポジトリに含めてよい。**

守るべき条件は `CLAUDE.md`「リポジトリ同梱の可否」に置いてある。
このファイルはその判断の根拠と、調査時点の同梱物の記録。

## なぜ良いと言えるか

1. Riot は Data Dragon の**全アセットを patch ごとの tarball
   （`https://ddragon.leagueoflegends.com/cdn/dragontail-{VER}.tgz`）で配布**しており、
   開発者が落として自分でホストすることを前提にしている。同梱は例外的な運用ではなく想定された使い方。
2. Developer General Policies は、使うべきアセットの入手元として Data Dragon を**明示的に指定**している
   — "Use the following assets in the development and marketing of your product:
   Data Dragon, Press Kit, TFT Assets, LOR Assets"。
3. Legal Jibber Jabber・API 規約・General Policies のいずれにも、
   プロジェクトのソースを public リポジトリで公開することを禁じる条項はない。

## 現状の同梱物

| パス                        | 内容                              | 判定 |
| --------------------------- | --------------------------------- | ---- |
| `public/champions/*.png`    | チャンピオンアイコン 173枚（5.0MB） | OK   |
| `data/raw/champion.*.json`  | ddragon champion.json（ja/en）    | OK   |
| `data/raw/item.ja_JP.json`  | ddragon item.json                 | OK   |
| `data/*.json`               | 上記から生成した自作の派生データ  | OK   |
