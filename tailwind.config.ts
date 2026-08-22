import type { Config } from "tailwindcss";

const config: Config = {
  // ダークテーマ推奨（PLAN.md 7章）。クラス指定で切替可能にしておく。
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AP = 青系（マジックダメージ）, AD = 橙/赤系（物理ダメージ）
        ap: {
          DEFAULT: "#3b82f6",
          soft: "#1e3a8a",
        },
        ad: {
          DEFAULT: "#f97316",
          soft: "#7c2d12",
        },
      },
    },
  },
  plugins: [],
};

export default config;
