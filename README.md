# 投遞追蹤看板（PWA）

記錄每次求職投遞，提醒你該跟進的職缺，統計各來源與各履歷版本的回應率。手機與電腦資料自動同步，可安裝成 App，離線時能看最近一次同步的資料。

**技術**：Next.js 16（App Router、`src/` 目錄）· React 19 + React Compiler · TypeScript · Tailwind CSS v4 · shadcn/ui · ESLint 9 · TanStack Query（伺服器狀態）· Zustand（UI 狀態）· Supabase（Postgres + Auth + Realtime）· Dexie（IndexedDB 離線快取）· 手寫 Service Worker

## 功能

- 看板／列表兩種檢視，搜尋與依來源篩選
- 貼上 104、Cake、LinkedIn 連結會自動判斷來源；貼上整段分享訊息時只會留下連結
- 提醒：超過 N 天沒消息（設定跨裝置同步）、或跟進日到了；一鍵複製跟進訊息、一鍵「已跟進」
- 回應率統計（各來源、各履歷版本）
- Google 登入；每個帳號只能讀寫自己的資料（Row Level Security）
- 跨裝置即時同步（Supabase Realtime），回到前景或恢復連線時自動補抓
- PWA：可安裝、離線可看、App 圖示角標顯示待處理數量（瀏覽器支援時）
- 匯出 JSON／CSV，匯入 JSON（可匯入先前 HTML 版本匯出的檔案）

## 快速開始

需要 Node.js 20.9 以上（Next.js 16 的要求；若安裝時報錯請以官方文件為準）與 [pnpm](https://pnpm.io)。

`package.json` 的 `packageManager` 已固定 pnpm 版本，啟用 Corepack 後會自動使用同一版（Vercel 也一樣）：

```bash
corepack enable
```

`pnpm-lock.yaml` 請一併提交到 Git。

常用指令：`pnpm dev`（port 3300）、`pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test`（Vitest，`pnpm test:watch` 為監看模式）。

## 版本與安全更新

`package.json` 把依賴的**下限**設在撰寫時（2026-10-20）已包含最新安全修補的版本：

- `next` ≥ 16.4.2（16.4.1 修補了 `use cache` 與 SVG 圖片處理的兩個嚴重遠端程式碼執行漏洞，以及 Server Actions 的阻斷服務漏洞）
- `react`、`react-dom` ≥ 19.3.1

這個專案本身沒有使用 Cache Components（`use cache`）或 `next/image` 處理使用者上傳的 SVG，
因此不在上述漏洞的主要攻擊面上，但仍建議維持在最新版。

之後請定期執行 `pnpm outdated` 與 `pnpm update --latest` 檢查更新，
並留意 [Next.js 安全公告](https://github.com/vercel/next.js/security/advisories) 與 [React 安全公告](https://github.com/facebook/react/security/advisories)。
`@supabase/ssr` 等 0.x 版本套件的 `^` 範圍只會升級到同一個次版本，需要用 `pnpm update --latest` 才會跟上新版。

### 1. 建立 Supabase 專案並建立資料表

1. 到 [supabase.com](https://supabase.com) 建立專案。
2. 開啟 **SQL Editor**，依序把 `supabase/migrations/` 裡的 `0001_init.sql`、`0002_harden.sql`、`0003_user_settings.sql` 各自整份貼上執行（依編號順序）。
   它會建立 `applications` 表、四條 RLS 政策（只能存取自己的資料）、`updated_at` 觸發器，並開啟 Realtime。
3. 在 **Table Editor** 確認 `applications` 旁邊顯示 RLS 已啟用。

### 2. 設定 Google 登入

1. 開啟 [Google Cloud Console](https://console.cloud.google.com)，建立（或選擇）一個專案。
2. **APIs & Services → OAuth consent screen**：選 External，填應用程式名稱與你的 email。
   測試階段請在 **Test users** 加入你自己的 Google 帳號。
3. **Credentials → Create credentials → OAuth client ID → Web application**。
   **Authorized redirect URIs** 填：
   `https://<你的專案代號>.supabase.co/auth/v1/callback`
   （專案代號在 Supabase 的 Project Settings → General。）
4. 複製 **Client ID** 和 **Client secret**。
5. 回到 Supabase：**Authentication → Sign In / Providers → Google**，貼上並啟用。
6. **Authentication → URL Configuration**：
   - Site URL：`http://localhost:3300`（上線後改成正式網址）
   - Redirect URLs 加入：`http://localhost:3300/auth/callback`，之後再加上 `https://你的網域/auth/callback`

### 3. 設定環境變數並啟動

```bash
cp .env.example .env.local
# 編輯 .env.local，填入 Supabase 的 URL 與 anon（或 publishable）key
pnpm install
pnpm dev
```

開啟 http://localhost:3300，用 Google 登入。

> **只能放 anon／publishable key。** `service_role`（secret）key 絕對不要放進 `NEXT_PUBLIC_` 變數或前端程式碼。

### 4. 測試 PWA

Service Worker 只在正式建置時註冊（避免開發時被快取干擾）：

```bash
pnpm build
pnpm start
```

桌機 Chrome 在網址列會出現安裝圖示。手機要求 HTTPS，所以要部署後才能安裝；
iOS 請用 Safari 的「加入主畫面」。

## 部署（Vercel）

1. 把專案推上 GitHub，到 Vercel 匯入。
2. 在 Vercel 的 Environment Variables 加入兩個 `NEXT_PUBLIC_SUPABASE_*` 變數。
3. 把正式網址加進 Supabase 的 Site URL 與 Redirect URLs（見上方步驟 2-6）。

## 在新電腦上開發

Supabase 與 Google 的後台設定是共用的（Redirect URLs 已包含 `http://localhost:3300/auth/callback`），換電腦只需要重建本機環境：

```bash
git clone <repo 網址>
cd job-tracker-pwa
corepack enable
pnpm install
```

接著取得環境變數，二選一：

- 複製 `.env.example` 為 `.env.local`，手動填入 Supabase 的 URL 與 anon／publishable key。
- 或用 Vercel CLI 拉下來：`vercel link`，再 `vercel env pull .env.local`。

然後執行 `pnpm dev`，開啟 http://localhost:3300。

> `.env.local` 不會也不應該提交到 Git。Google 的 Client Secret 只存在 Supabase 後台，不需要放在本機。

## 樣式、元件與工具

- **Tailwind CSS v4**：沒有 `tailwind.config`，主題寫在 `src/app/globals.css` 的 `:root` 與 `@theme inline`。
  色票沿用原本的灰綠＋深青色，並跟隨系統深色模式；六個狀態顏色是 `status-*` 色彩 token。
- **shadcn/ui**：`src/components/ui/` 內的檔案是 shadcn 風格的原始碼（可直接改）。用到 Button、Input、Textarea、Label、Badge、Card、Dialog、DropdownMenu、ToggleGroup、Sonner；
  下拉選單保留原生 `<select>`（`NativeSelect`），手機上會是系統選單。要新增其他元件：`pnpm dlx shadcn@latest add <name>`。
  這些檔案是手寫的，若你想與官方版本完全一致，可以用 `pnpm dlx shadcn@latest add button dialog … --overwrite` 覆蓋。
- **React Compiler**：`next.config.ts` 的 `reactCompiler: true`，依賴 `babel-plugin-react-compiler`。
  程式碼因此不手寫 `useMemo`／`useCallback`；`pnpm lint` 內含的 React Compiler 規則會提醒不符合規則的寫法。
  啟用後 `next build` 會比較慢（改用 Babel 處理 React 元件），屬正常現象。
- **ESLint**：Next.js 16 已移除 `next lint`，所以直接執行 `pnpm lint`。

## 驗證隱私設定（建議做一次）

用兩個不同的 Google 帳號各登入一次、各新增一筆資料，確認彼此看不到對方的紀錄。
資料表層級的保護由 `0001_init.sql` 的 RLS 政策負責（`0002_harden.sql` 再補強），前端程式碼只是讓畫面更方便。

## 架構

```
src/app/              頁面、layout、manifest、OAuth callback、globals.css（Tailwind + 主題色票）
src/components/       畫面元件（Dashboard、Board、Panels、AppForm…）
src/components/ui/    shadcn/ui 元件（button、dialog、dropdown-menu、toggle-group、sonner…）
src/lib/              型別、日期、提醒規則、統計、資料轉換、匯出、離線快取（純函式為主）、cn()
src/hooks/            TanStack Query：useApplications（讀取）、useApplicationsRealtime、useUpsertApplication、useRemoveApplication、useImportApplications
src/store/            Zustand：只放 UI 狀態（檢視、篩選、提醒天數、偏好）
src/proxy.ts          Next.js 16 的 proxy（舊稱 middleware），負責更新 Supabase 登入 cookie
public/sw.js          Service Worker
supabase/             資料表與 RLS 的 SQL
components.json       shadcn/ui 設定
eslint.config.mjs     ESLint flat config（eslint-config-next，含 React Compiler 規則）
```

- 頁面本身是薄殼，登入與資料都在瀏覽器端載入，因此 HTML 可被 Service Worker 快取，離線也能開啟。
  資料的存取安全由 Supabase RLS 保證，不依賴頁面。
- 狀態分工：Supabase 的資料（投遞紀錄）是伺服器狀態，由 TanStack Query 管理；Zustand 只存檢視方式、篩選、提醒天數等 UI 狀態。
- 啟動時先讀 IndexedDB 快取（快速顯示），同時向 Supabase 取得最新資料並覆寫快取。切回分頁、恢復連線時 TanStack Query 會自動重新抓取。
- 寫入採樂觀更新（`useMutation` 的 `onMutate`）：先改畫面，失敗再回滾並提示。Realtime 事件直接寫入 query cache。
- 登出時會清除 IndexedDB 快取，避免共用裝置上的下一個人看到你的資料。

## 已知限制

- **離線時只能查看，不能編輯。** 離線編輯後再同步需要衝突處理，第一版沒有做。
- **沒有背景推播。** 提醒是在開啟 App 時計算，並更新圖示角標。若要「到時間就通知」，需要 Web Push（見下方）。
- **Service Worker 只快取首頁與靜態資源**，且需要先上線瀏覽過一次，離線才會有東西可開。
- Supabase 免費方案的專案閒置一段時間會被暫停，需要到後台恢復；確切規則請以官方文件為準。
- **這份程式碼在建置環境中沒有實際執行過 `next build`、`pnpm lint`，也沒有看過 shadcn／Tailwind 改版後的實際畫面**（該環境無法安裝 npm 套件）。
  純函式已通過型別檢查，所有檔案做過語法檢查，但第一次建置時可能遇到套件版本、Tailwind class 或 lint 規則造成的小問題。
  若 `pnpm install` 對某個版本報錯，請改用 `pnpm add <套件>@latest`。
- 第一次安裝如果 pnpm 提示有套件的 build script 被擋下，請執行 `pnpm approve-builds` 檢視並決定是否允許。
  這是 pnpm 10 以後預設的供應鏈保護，不是錯誤。

## 下一步：Web Push（第二階段）

1. 新增 `push_subscriptions` 表（含 RLS），前端取得通知權限後存下訂閱。
2. 用 `web-push` 與 VAPID 金鑰寫一個 Supabase Edge Function 或 Next.js route。
3. 用 `pg_cron` 或 Vercel Cron 每天早上檢查哪些職缺需要跟進並發送。
4. 在 `public/sw.js` 啟用 `push` 與 `notificationclick` 處理（檔案底部已留位置）。

注意：iOS 的 Web Push 需要 iOS 16.4 以上，且必須已「加入主畫面」。
