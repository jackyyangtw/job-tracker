import path from 'node:path';
import { defineConfig } from 'vitest/config';

// 日期相關的邏輯依賴本地時區；固定用台灣時間，不管在哪台電腦或雲端跑，結果都一樣。
process.env.TZ = 'Asia/Taipei';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
