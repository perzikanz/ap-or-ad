import { PATCH } from "@/lib/data";

/**
 * フッター。以下を必ず含める（CLAUDE.md「必ずやること」）:
 *  1. Legal Jibber Jabber 第6条の帰属表示（公式サイトからの正確なコピー）
 *  2. データのパッチバージョン
 *
 * ⚠ 帰属表示の本文は https://www.riotgames.com/en/legal 第6条から
 *   **逐語でコピーし、[The title of your Project] を "AP or AD" に置換** すること。
 *   記憶や推測で書いてはいけない（CLAUDE.md）。下記はプレースホルダー。
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 px-4 py-6 text-xs leading-relaxed text-white/50">
      <div className="mx-auto max-w-2xl space-y-3">
        {/* --- 帰属表示（要・公式からの差し替え） --- */}
        <p data-legal-attribution>
          {/* TODO(legal): riotgames.com/en/legal 第6条の本文を逐語でここに貼り、
              [The title of your Project] を「AP or AD」に置換すること。
              下記は文言確定までの暫定表示。 */}
          AP or AD は Riot Games の許諾を受けていない非公式のファンプロジェクトです。
          このプロジェクトは Riot Games または League of Legends の制作・運営に
          公式に関与するいずれの当事者からも承認・支援を受けていません。
          （※この段落は Legal Jibber Jabber 第6条の正式な帰属表示に差し替える必要があります。）
        </p>

        <p>
          これは <span className="whitespace-nowrap">League of Legends</span>{" "}
          のファンプロジェクトです。
        </p>

        {/* --- パッチバージョン明記（CLAUDE.md） --- */}
        <p>
          このデータはパッチ{" "}
          <span className="font-mono text-white/70">{PATCH}</span>{" "}
          時点のものです。
        </p>
      </div>
    </footer>
  );
}
