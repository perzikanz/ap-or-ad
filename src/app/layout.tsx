import type { Metadata, Viewport } from "next";
import "./globals.css";

// ⚠ CLAUDE.md: <title> / og:title に Riot の商標・チャンピオン名を入れない。
//   サイト名はゲーム内の一般的な略語 "AP or AD" のみで構成する。
//   <meta name="keywords"> はそもそも設置しない。
export const metadata: Metadata = {
  title: "AP or AD",
  description:
    "チャンピオンの主なダメージ源が AP か AD かを当てる 2 択クイズ。League of Legends の非公式ファンプロジェクト。",
  openGraph: {
    title: "AP or AD",
    description: "チャンピオンの主なダメージ源が AP か AD かを当てる 2 択クイズ。",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="dark">
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
