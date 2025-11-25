import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Next.js + Core Web Vitals 向けの推奨設定
  ...nextCoreWebVitals,
  // TypeScript 用の追加ルール
  ...nextTs,
  // 無視したいファイル/ディレクトリ
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
