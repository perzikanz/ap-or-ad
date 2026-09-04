import type { Champion } from "./data";

/** プレイヤーが押せる選択肢。HYBRID は通常モードでは出題されないので含めない。 */
export type Choice = "AP" | "AD";

export interface AnswerRecord {
  champion: Champion;
  choice: Choice;
  correct: boolean;
}

/** Fisher–Yates。random は乱数源を差し替えられるようにしてテスト・再現を可能にする。 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 出題する count 体を重複なしで選ぶ。
 * Phase 2 入力途中のように pool が count 未満のときは、あるぶんだけ出題する。
 */
export function pickQuestions(
  pool: readonly Champion[],
  count: number,
  random?: () => number,
): Champion[] {
  return shuffle(pool, random).slice(0, Math.min(count, pool.length));
}

export function isCorrect(champion: Champion, choice: Choice): boolean {
  return champion.answer === choice;
}
