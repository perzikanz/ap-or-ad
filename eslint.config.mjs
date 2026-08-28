// eslint-config-next 16 は flat config を直接提供するため、
// @eslint/eslintrc の FlatCompat 経由の読み込みは不要になった。
import next from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...next,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "data/**"],
  },
];

export default eslintConfig;
