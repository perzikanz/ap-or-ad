/**
 * アプリ全体の設定・フラグ類。
 *
 * ここに集約する理由:
 *  - しきい値は実データを見てから調整する前提（PLAN.md 1.1）
 *  - SHOW_CHAMPION_IMAGES は法的リスクを下げるためのフラグ（CLAUDE.md グレーゾーン対処）で、
 *    false でも UI が破綻しないことが必須要件。
 */

/**
 * チャンピオン画像を表示するかどうか。
 *
 * CLAUDE.md の指示により **必ず実装する** フラグ。
 * false にすると出題はチャンピオン名テキストのみになり、Data Dragon の画像を一切使わない。
 * 後から画像を外せる状態を保つためのもの。
 */
export const SHOW_CHAMPION_IMAGES = true;

/**
 * AP / AD 判定のしきい値。
 *
 *   ap_ratio >= AP_THRESHOLD           -> "AP"
 *   ap_ratio <= AD_THRESHOLD           -> "AD"
 *   それ以外                            -> "HYBRID"
 *
 * PLAN.md 1.1 の表に対応。実データを見てから調整する。
 * ここを変えたら scripts/build-champions.ts を再実行して champions.json を作り直すこと。
 */
export const THRESHOLDS = {
  ap: 0.7,
  ad: 0.3,
} as const;

/** 1セットの出題数（PLAN.md Phase 3: 10問1セット）。 */
export const QUESTIONS_PER_SET = 10;

/** 正誤表示後、自動で次へ進むまでのミリ秒（PLAN.md 7章: 0.5〜1秒）。 */
export const FEEDBACK_DELAY_MS = 800;

/** localStorage のキー接頭辞。 */
export const STORAGE_PREFIX = "ap-or-ad";

/** 回答ラベルの型。 */
export type Answer = "AP" | "AD" | "HYBRID";
