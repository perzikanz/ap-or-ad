import Link from "next/link";
import ChampionImage from "./ChampionImage";
import type { AnswerRecord } from "@/lib/quiz";

interface Props {
  records: AnswerRecord[];
  onRetry: () => void;
}

export default function QuizResult({ records, onRetry }: Props) {
  const correct = records.filter((r) => r.correct).length;
  const wrong = records.filter((r) => !r.correct);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <section className="text-center">
        <p className="text-sm text-white/60">結果</p>
        <p className="mt-1 text-6xl font-black tabular-nums">
          {correct}
          <span className="text-2xl text-white/40"> / {records.length}</span>
        </p>
      </section>

      {/* 間違えた一覧が学習価値になる（PLAN.md 7章）。 */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-white/80">
          {wrong.length === 0 ? "全問正解！" : `間違えたチャンピオン（${wrong.length}）`}
        </h2>
        {wrong.length > 0 && (
          <ul className="mt-3 divide-y divide-white/10">
            {wrong.map(({ champion }) => (
              <li key={champion.id} className="flex items-center gap-3 py-2">
                <ChampionImage
                  champion={champion}
                  size={40}
                  className="size-10 shrink-0 rounded-lg"
                />
                <span className="flex-1 truncate">{champion.name_ja}</span>
                <span
                  className={`text-sm font-bold ${
                    champion.answer === "AP" ? "text-ap" : "text-ad"
                  }`}
                >
                  {champion.answer}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-auto grid grid-cols-2 gap-3">
        <Link
          href="/"
          className="rounded-2xl border border-white/15 py-4 text-center font-semibold active:scale-95"
        >
          トップへ
        </Link>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-2xl bg-white py-4 font-semibold text-black active:scale-95"
        >
          もう一度
        </button>
      </div>
    </main>
  );
}
