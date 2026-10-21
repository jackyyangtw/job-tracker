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

### 1. 推播提醒（最高價值）

跟進日當天主動通知，不必開 App 才看得到「該跟進了」。`public/sw.js` 已有 push 的預留位置。

- [ ] 設計：通知時機（跟進日當天早上？）、文案、同一天多筆是否合併
- [ ] 資料表 `push_subscriptions`（user_id、endpoint、keys、裝置名稱），**必須開 RLS**（`auth.uid() = user_id`）
- [ ] 產生 VAPID 金鑰；私鑰只放 Supabase Edge Function 的 secrets，不進程式碼、不放 `NEXT_PUBLIC_*`
- [ ] Supabase Edge Function + 排程（cron）：查 `follow_up_at`，發送 Web Push，清掉失效的訂閱
- [ ] 前端：通知權限請求流程（需由使用者點擊觸發）、訂閱／取消訂閱的開關
- [ ] `sw.js`：實作 `push`、`notificationclick`（點通知開啟對應的投遞），並升級 `CACHE_VERSION`
- [ ] 評估使用宣告式推播（iOS 18.4+）
- [ ] iPhone 實機測試（需 HTTPS，先部署到 Vercel）

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
