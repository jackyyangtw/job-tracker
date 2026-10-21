# TODO：PWA 功能規劃

主要使用裝置是 **iPhone（iOS 26）**，下面依這個前提排優先順序。已完成：安裝到主畫面、離線檢視、App 圖示角標。

## iOS 支援概況

| 功能 | iOS 26 |
| --- | --- |
| 安裝到主畫面、離線快取 | 支援 |
| App 圖示角標 | 支援（需先安裝並同意通知權限） |
| Web Push 推播 | 支援（僅限已加入主畫面的 App；iOS 18.4 起有宣告式推播） |
| Web Share API | 支援 |
| Share Target、Manifest Shortcuts、Background Sync | 不支援（Share Target 在 iOS 26 是否仍不支援，需實測確認） |

## 待辦

### 1. 推播提醒（暫緩）

> 狀態：設計已完成，目前**暫緩**，非必做。要開始時先確認下方「待決定」事項。

不開 App 也能收到「該跟進了」的通知。目前提醒只在打開 App 時於瀏覽器端即時計算（`src/lib/flags.ts`），App 沒開就完全不會被提醒。`public/sw.js` 已有 push 的預留位置。

#### 待決定（括號內為建議）

- [ ] **發送端**：Vercel Cron + Next.js API（建議）／Supabase Edge Function + pg_cron
  - Vercel：Node.js 環境，`web-push` 套件成熟，程式與專案放一起。免費版排程每天最多一次，且只保證在指定的那個小時內執行。
  - Supabase：離資料近，但 Deno 環境的推播套件相容性需另外測試。
- [ ] **提醒時間**：（每天台灣時間 09:00，即 UTC `0 1 * * *`）
- [x] **「超過 N 天」的 N**：已同步到資料庫的 `user_settings.stale_days`（`0003_user_settings.sql`），伺服器可直接讀取。
- [ ] **鎖定畫面的內容**：（只顯示筆數，例如「有 3 筆投遞該跟進了」）。顯示公司名稱較實用，但鎖定畫面上別人看得到。

#### 整體流程

```
[iPhone 主畫面 App] 開啟通知 → 訂閱推播 → 存進 push_subscriptions
[Vercel Cron 每天一次] → /api/cron/reminders
    → 用 service_role 讀取所有使用者的投遞、設定與訂閱
    → 以台灣時間的「今天」計算提醒（共用 flags.ts 的規則）
    → 每位使用者合併成一則通知，發送到他的每台裝置
    → 失效的訂閱（404／410）直接刪除
[Service Worker] 收到推播 → 顯示通知、更新圖示角標 → 點通知開啟 App
```

#### 資料表（`supabase/migrations/0004_push.sql`）

- `push_subscriptions`：每台裝置一筆
  - `id`、`user_id`（預設 `auth.uid()`，刪除使用者時一併刪除）、`endpoint`（唯一）、`p256dh`、`auth`、`user_agent`（辨識是哪台裝置）、`created_at`
  - 開 RLS 並只允許 `auth.uid() = user_id`、`revoke all ... from anon`
- `user_settings`：已存在（`0003_user_settings.sql`，含 `stale_days`），推播時再加欄位：`notify_enabled`、`last_notified_on`（避免同一天重複發送）

#### 環境變數

| 名稱 | 用途 | 可公開 |
| --- | --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 前端訂閱推播用 | 是 |
| `VAPID_PRIVATE_KEY` | 伺服器簽署推播 | **否** |
| `VAPID_SUBJECT` | 聯絡方式，例如 `mailto:` | 是 |
| `SUPABASE_SERVICE_ROLE_KEY` | 排程讀取所有使用者資料（會繞過 RLS） | **否，絕不可加 `NEXT_PUBLIC_`** |
| `CRON_SECRET` | 驗證請求確實來自 Vercel Cron | **否** |

以上都只放在 Vercel 與本機的 `.env.local`，`.env.example` 只寫佔位符。

#### 前端

- 「通知」開關：放在頁首選單。只在支援推播時顯示；iPhone 若不是從主畫面開啟，改顯示「請先加入主畫面」。
- 開啟：由使用者點擊觸發 → `Notification.requestPermission()` → `pushManager.subscribe()` → upsert 到 `push_subscriptions`。
- 關閉：`subscription.unsubscribe()` 並刪除該筆資料。
- **登出前要先刪除這台裝置的訂閱**，否則共用裝置的下一個人會收到前一個人的提醒。
- Service Worker 目前只在正式建置時註冊，本機測試要用 `pnpm build && pnpm start`。

#### Service Worker（`public/sw.js`）

- `push`：解析 `{ title, body, url, badge }`，顯示通知並更新角標。
- `notificationclick`：已開著的視窗就切過去，沒有就開新視窗到 `url`。
- 升級 `CACHE_VERSION`。
- 之後可評估 iOS 18.4 起的宣告式推播（通知內容直接寫在推播資料裡，不必喚醒 Service Worker）。

#### 發送端（`src/app/api/cron/reminders/route.ts`）

- 第一件事：檢查 `Authorization: Bearer <CRON_SECRET>`，不符合就回 401。
- service_role 的 client 獨立放在 `src/lib/supabase/admin.ts`，並 `import 'server-only'`，確保不會被打包進前端。
- 「今天」用台灣時區（`Asia/Taipei`）計算，不能直接用伺服器的 UTC。
- 規則沿用 `flagsOf()`，與畫面上的提醒一致。
- 同一使用者當天已發送過（`last_notified_on`）就跳過，避免排程重試造成重複通知。
- `vercel.json` 設定 `crons`。

#### 實作步驟

- [ ] 決定上面的「待決定」事項
- [ ] 產生 VAPID 金鑰、設定環境變數（Vercel 與本機）
- [ ] migration `0004_push.sql`，在 Supabase 執行並用 SQL 驗證 RLS
- [x] `stale_days` 同步到 `user_settings`
- [ ] 前端通知開關（訂閱、取消、登出時清除）
- [ ] `sw.js` 的 `push` 與 `notificationclick`
- [ ] 排程 API 與 `vercel.json` 的 crons
- [ ] 本機測試：Chrome 訂閱後，用 curl 帶 `CRON_SECRET` 手動觸發排程
- [ ] iPhone 實測：部署、加入主畫面、在 App 內登入、開啟通知、從 Vercel 手動觸發排程
- [ ] 更新 `CLAUDE.md`（專案又有伺服器端程式）、README 與 `docs/features.md`

### 2. 用 `?url=` 參數開啟新增表單（搭配 iOS 捷徑補上「分享」）

iOS 不支援 Share Target，改用「捷徑」App 的分享選單當入口。

- [ ] App 支援 `/?add=<職缺網址>`：開啟新增表單並帶入網址（來源沿用 `detectSource` 自動判斷）
- [ ] 處理未登入的情況：先導向 `/login`，登入後保留參數再回來
- [ ] 做一個 iOS 捷徑（接收分享的網址 → 開啟上述連結），並把步驟寫進 README
- [ ] 實測：從捷徑開啟的連結，會在 Safari 還是已安裝的獨立 App 開啟（不確定，需驗證）

### 3. Web Share API：分享跟進訊息

目前「複製跟進訊息」只能複製，改成可一鍵分享到 LINE、郵件等。

- [ ] 用 `navigator.share` 分享 `followUpMessage` 的內容
- [ ] 不支援時退回現有的複製行為
- [ ] 在「該跟進了」清單與卡片上加入分享入口

### 4. 暫不做

- **Manifest Shortcuts**：iOS 不支援，對主要裝置沒有效益。
- **離線寫入佇列**：iOS 沒有 Background Sync，只能做成「回到前景時補送」，還要處理兩台裝置離線改同一筆的衝突，成本高。除非常在沒訊號的地方記錄，否則不急。

## 注意事項

- iOS 的 Safari 與已安裝的主畫面 App，cookie 與 IndexedDB 是**分開**的，安裝後需在 App 內重新登入。Google 登入在獨立 App 模式下的導回行為要實機測試。
- 推播相關資料表一律開 RLS，金鑰只放伺服器端 secrets。
- 104 會封鎖雲端主機（Vercel）的請求，所以推播排程不能依賴去 104 抓資料；只用自己資料庫裡的內容。
