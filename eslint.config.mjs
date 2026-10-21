import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Next.js 16 移除了 `next lint`，直接執行 ESLint（`pnpm lint`）。
// eslint-config-next 已內建 eslint-plugin-react-hooks，包含 React Compiler 的規則。
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/sw.js']),
]);
