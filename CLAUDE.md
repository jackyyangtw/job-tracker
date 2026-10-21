# 投遞追蹤看板（job-tracker-pwa）

求職投遞追蹤 PWA。Next.js 16（App Router、`src/`）· React 19 + React Compiler · TypeScript · Tailwind v4 · shadcn/ui · Supabase（Postgres + Auth + Realtime）· Dexie（離線快取）。

## 指令

- `pnpm dev`（固定 port **3300**）、`pnpm build`、`pnpm lint`、`pnpm typecheck`
- 套件管理用 pnpm，不要用 npm／yarn。
- 完成修改後跑 `pnpm typecheck`（與 `pnpm lint`）確認。

## 必須遵守

- 撰寫、修改或審查 React／Next.js 程式碼前，先使用 `vercel-react-best-practices` skill，並依其規則實作。
- 回覆與程式碼註解以繁體中文（台灣用語）為主；UI 文案也是繁體中文。

## 架構

- **路由**：`/applications`（投遞）、`/statistics`（統計）、`/settings`（設定）放在 `src/app/(dashboard)/`，共用 `AppShell`（登入檢查、資料、Realtime、提醒天數同步、導覽列），頁面用 `useShell()` 取得資料；`/` 會導到 `/applications`。新增需要登入的頁面時放進 `(dashboard)`，並加進 `public/sw.js` 的 `SHELL_PAGES`。
- **伺服器狀態**用 TanStack Query，hook 放在 `src/hooks/`（`useApplications`、`useUpsertApplication` 等），採樂觀更新，失敗要回復並 toast。
- **UI 狀態**用 Zustand（`src/store/useTrackerStore.ts`），只放檢視模式、篩選等；不要把投遞資料放進去。
- **離線**：IndexedDB（Dexie）先顯示快取，Supabase 回應後覆蓋（`src/lib/cache.ts`）。
- 資料存取由瀏覽器直接用 `supabase-js`，**沒有自己的後端／ORM**；權限完全靠 Row Level Security（`supabase/migrations/`）。
- `src/lib/mapping.ts` 負責資料庫列（snake_case）與前端型別（camelCase）互轉。

## 元件拆分

- 元件超過約 200 行就考慮拆分；這是警訊而不是硬上限，**以職責為準，不為湊行數而拆**。
- 要拆時開一個與元件同名的資料夾：主元件放 `index.tsx` 並 `export default function 元件名`，子元件、專屬 hook 放在同一個資料夾（例如 `components/AppForm/`、`components/Dashboard/`）。
- 專屬 hook 以 `use` 開頭，放在同一資料夾；跨元件共用的才放 `src/hooks/`。
- 外部以資料夾名稱 import（`@/components/AppForm`），不要直接 import 資料夾內的子檔案。

## 安全

- 絕不把 `service_role`／secret key 放進程式碼或任何 `NEXT_PUBLIC_*` 變數。
- `.env.local` 不可提交；只更新 `.env.example` 的佔位符。
- 新增資料表必須同時開 RLS 並寫 policy（`auth.uid() = user_id`）。
- 若要新增伺服器端 API：必須先驗證登入，且對外請求的網址要由程式自己組出，不可直接使用使用者提供的網址（避免 SSRF）。
- repo 計畫公開：不要提交真實的投遞資料或個人資訊。

## 開發環境注意

- Supabase Auth 的 Site URL／Redirect URLs 需包含 `http://localhost:3300` 與 `/auth/callback`。
- DevTools：Zustand 已接 Redux DevTools、TanStack Query 已接 ReactQueryDevtools（只在開發環境啟用）。
- `.agents/`、`.claude/`、`skills-lock.json` 已加入 `.gitignore`，不提交。
