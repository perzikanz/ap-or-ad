import Image from "next/image";
import { SHOW_CHAMPION_IMAGES } from "@/config";
import type { Champion } from "@/lib/data";

interface Props {
  champion: Champion;
  size: number;
  className?: string;
  priority?: boolean;
}

/**
 * チャンピオンアイコン。SHOW_CHAMPION_IMAGES が false のときは何も描かず、
 * 呼び出し側は名前テキストだけで成立するレイアウトにしておく（CLAUDE.md グレーゾーン対処）。
 */
export default function ChampionImage({ champion, size, className, priority }: Props) {
  if (!SHOW_CHAMPION_IMAGES) return null;
  return (
    <Image
      src={`/champions/${champion.image}`}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
