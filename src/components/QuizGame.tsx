"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChampionImage from "./ChampionImage";
import QuizResult from "./QuizResult";
import { FEEDBACK_DELAY_MS, QUESTIONS_PER_SET } from "@/config";
import type { Champion } from "@/lib/data";
import { isCorrect, pickQuestions, type AnswerRecord, type Choice } from "@/lib/quiz";

interface Props {
  pool: Champion[];
}

/**
 * 出題順を乱数で決めるため、サーバー側で描画すると水和時に食い違う。
 * QuizClient 経由で ssr: false にして呼ぶこと。
 */
export default function QuizGame({ pool }: Props) {
  const [questions, setQuestions] = useState(() => pickQuestions(pool, QUESTIONS_PER_SET));
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [pending, setPending] = useState<Choice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    setQuestions(pickQuestions(pool, QUESTIONS_PER_SET));
    setRecords([]);
    setPending(null);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const advance = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPending(null);
  }, []);

  const index = records.length - (pending ? 1 : 0);
  if (index >= questions.length) {
    return <QuizResult records={records} onRetry={start} />;
  }

  const champion = questions[index];

  const choose = (choice: Choice) => {
    if (pending) return;
    setRecords((prev) => [...prev, { champion, choice, correct: isCorrect(champion, choice) }]);
    setPending(choice);
    // 待たせない: 自動で次へ進むが、タップで即スキップもできる（PLAN.md 7章）。
    timer.current = setTimeout(advance, FEEDBACK_DELAY_MS);
  };

  const last = pending ? records[records.length - 1] : null;

  return (
    <main
      className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 select-none"
      onClick={pending ? advance : undefined}
    >
      <p className="text-center text-sm tabular-nums text-white/50">
        {index + 1} / {questions.length}
      </p>

      <section className="flex flex-1 flex-col items-center justify-center gap-5">
        <ChampionImage
          champion={champion}
          size={160}
          priority
          className="size-40 rounded-3xl shadow-2xl"
        />
        <h1 className="text-center text-3xl font-black">{champion.name_ja}</h1>
        <p className="text-sm text-white/40">{champion.name_en}</p>

        {/* 高さを固定して、正誤表示の出入りでボタン位置が動かないようにする。 */}
        <p className="h-8 text-xl font-bold">
          {last &&
            (last.correct ? (
              <span className="text-emerald-400">正解！</span>
            ) : (
              <span className="text-rose-400">
                不正解… 正解は{" "}
                <span className={last.champion.answer === "AP" ? "text-ap" : "text-ad"}>
                  {last.champion.answer}
                </span>
              </span>
            ))}
        </p>
      </section>

      {/* 片手操作前提で画面下部に大きく置く（PLAN.md Phase 3）。 */}
      <div className="grid grid-cols-2 gap-3">
        <ChoiceButton
          choice="AP"
          onChoose={choose}
          state={buttonState("AP", last)}
        />
        <ChoiceButton
          choice="AD"
          onChoose={choose}
          state={buttonState("AD", last)}
        />
      </div>
    </main>
  );
}

type ButtonState = "idle" | "correct" | "wrong" | "dim";

function buttonState(choice: Choice, last: AnswerRecord | null): ButtonState {
  if (!last) return "idle";
  if (last.champion.answer === choice) return "correct";
  if (last.choice === choice) return "wrong";
  return "dim";
}

const BUTTON_STYLE: Record<Choice, Record<ButtonState, string>> = {
  AP: {
    idle: "bg-ap-soft text-ap border-ap/40 active:scale-95",
    correct: "bg-ap text-white border-ap",
    wrong: "bg-ap-soft/40 text-ap/60 border-rose-500 line-through",
    dim: "bg-ap-soft/40 text-ap/40 border-transparent",
  },
  AD: {
    idle: "bg-ad-soft text-ad border-ad/40 active:scale-95",
    correct: "bg-ad text-white border-ad",
    wrong: "bg-ad-soft/40 text-ad/60 border-rose-500 line-through",
    dim: "bg-ad-soft/40 text-ad/40 border-transparent",
  },
};

function ChoiceButton({
  choice,
  state,
  onChoose,
}: {
  choice: Choice;
  state: ButtonState;
  onChoose: (c: Choice) => void;
}) {
  return (
    <button
      type="button"
      aria-disabled={state !== "idle"}
      onClick={(e) => {
        // 正誤表示中はボタンごと画面タップ扱いにして次へ進める。
        if (state !== "idle") return;
        e.stopPropagation();
        onChoose(choice);
      }}
      className={`min-h-24 rounded-2xl border-2 text-4xl font-black transition touch-manipulation ${BUTTON_STYLE[choice][state]}`}
    >
      {choice}
    </button>
  );
}
