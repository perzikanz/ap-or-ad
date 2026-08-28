import { PATCH } from "@/lib/data";

/**
 * フッター。以下を必ず含める（CLAUDE.md「必ずやること」）:
 *  1. Legal Jibber Jabber 第6条の帰属表示
 *  2. Developer General Policies の免責文（API キー取得時点で拘束される）
 *  3. データのパッチバージョン
 *
 * 1 と 2 は Riot が文面を指定しているため、和訳せず原文のまま出す。
 * プレースホルダ部分（[The title of your Project] / [Your product]）のみ差し替えている。
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 px-4 py-6 text-xs leading-relaxed text-white/50">
      <div className="mx-auto max-w-2xl space-y-3">
        {/* --- Legal Jibber Jabber 第6条（riotgames.com/en/legal） --- */}
        <p data-legal-attribution>
          AP or AD was created under Riot Games&apos; &quot;Legal Jibber
          Jabber&quot; policy using assets owned by Riot Games. Riot Games does
          not endorse or sponsor this project.
        </p>

        {/* --- Developer General Policies（developer.riotgames.com/policies/general） --- */}
        <p data-legal-disclaimer>
          AP or AD isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the
          views or opinions of Riot Games or anyone officially involved in
          producing or managing Riot Games properties. Riot Games, and all
          associated properties are trademarks or registered trademarks of Riot
          Games, Inc.
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
