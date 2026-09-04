"use client";

import dynamic from "next/dynamic";
import type { Champion } from "@/lib/data";

// 出題順は乱数なので、静的 HTML には焼き込まずクライアントでだけ描画する。
const QuizGame = dynamic(() => import("./QuizGame"), {
  ssr: false,
  loading: () => (
    <main className="flex flex-1 items-center justify-center text-white/50">読み込み中…</main>
  ),
});

export default function QuizClient({ pool }: { pool: Champion[] }) {
  return <QuizGame pool={pool} />;
}
