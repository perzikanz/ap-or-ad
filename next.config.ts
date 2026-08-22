import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的エクスポート。サーバーサイド処理を持たず、Vercel Hobby / 任意の静的ホストで動く。
  output: "export",
  // 静的エクスポートでは Next の画像最適化サーバーが使えないため無効化する。
  // チャンピオン画像はビルド時に public/champions/ に取り込む前提（PLAN.md 参照）。
  images: {
    unoptimized: true,
  },
  // 末尾スラッシュを付けると out/ 配下が /path/index.html 構造になり、
  // 静的ホスティングでのルーティングが安定する。
  trailingSlash: true,
};

export default nextConfig;
