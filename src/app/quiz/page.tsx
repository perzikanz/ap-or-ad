import Footer from "@/components/Footer";
import QuizClient from "@/components/QuizClient";
import { normalModeChampions } from "@/lib/data";

export default function QuizPage() {
  // 静的エクスポートなので、出題プールはビルド時にここで確定させて client に渡す。
  return (
    <>
      <QuizClient pool={normalModeChampions()} />
      <Footer />
    </>
  );
}
