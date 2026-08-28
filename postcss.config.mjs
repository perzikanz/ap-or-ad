/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // v4 で PostCSS プラグインが本体から分離された。ベンダープレフィックス付与も
    // v4 が内包するため autoprefixer は不要。
    "@tailwindcss/postcss": {},
  },
};

export default config;
