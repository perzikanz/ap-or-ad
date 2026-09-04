import Link from "next/link";
import Footer from "@/components/Footer";
import { hasData, normalModeChampions, hybridModeChampions } from "@/lib/data";

export default function Home() {
  const dataReady = hasData();
  const normalCount = normalModeChampions().length;
  const hybridCount = hybridModeChampions().length;

  return (
    <>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tight">
            <span className="text-ap">AP</span>
            <span className="text-white/40"> or </span>
            <span className="text-ad">AD</span>
          </h1>
          <p className="text-sm text-white/60">
            チャンピオンの主なダメージ源が AP か AD かを当てる 2 択クイズ
          </p>
        </div>

        {dataReady ? (
          <div className="flex w-full flex-col gap-3">
            {normalCount > 0 ? (
              <Link
                href="/quiz"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-left active:scale-[0.98]"
              >
                <p className="text-sm font-semibold">通常モード</p>
                <p className="mt-1 text-xs text-white/50">
                  出題対象 {normalCount} 体（HYBRID を除く）
                </p>
              </Link>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-white/50">
                <p className="text-sm font-semibold">通常モード</p>
                <p className="mt-1 text-xs">出題対象がまだありません（PLAN.md Phase 2）</p>
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left">
              <p className="text-sm font-semibold">魔境モード</p>
              <p className="mt-1 text-xs text-white/50">
                HYBRID のみ {hybridCount} 体（Phase 4 で実装）
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-6 text-sm text-white/60">
            <p className="font-semibold text-white/80">データ未生成</p>
            <p className="mt-2 leading-relaxed">
              チャンピオンデータがまだありません。
              <br />
              <code className="rounded bg-black/40 px-1 py-0.5 text-xs">
                npm run data:all
              </code>{" "}
              を Data Dragon に接続できる環境で実行してください（PLAN.md Phase 1）。
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
