## 1. 環境設定

- [x] 1.1 建立專案目錄結構：`src/bot/`、`src/db/`，初始化 `package.json`
- [x] 1.2 安裝依賴（資料儲存：SQLite（better-sqlite3））：`@line/bot-sdk`、`express`、`better-sqlite3`、`dotenv`
- [x] 1.3 建立 `.env.example` 含 `LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN` 佔位符；建立 `.gitignore` 排除 `.env` 與 `*.db`

## 2. 資料庫層

- [x] 2.1 在 `src/db/schema.js` 建立 SQLite 建表 SQL：`orders`（id, restaurant_name, status, created_by, created_at）、`menu_items`（id, order_id, name, price）、`order_items`（id, order_id, user_id, user_name, menu_item_id）、`payments`（id, order_id, user_id, method, paid）、`sessions`（user_id, state, data, updated_at）；應用程式啟動時執行建表
- [x] 2.2 在 `src/db/queries.js` 實作 Order CRUD：`createOrder`、`getActiveOrder`（status IN open/confirmed）、`updateOrderStatus` — 支援訂單狀態機（open → confirmed → closed）
- [x] 2.3 在 `src/db/queries.js` 實作 MenuItem CRUD：`addMenuItem`、`getMenuItems(orderId)`
- [x] 2.4 在 `src/db/queries.js` 實作 OrderItem CRUD：`upsertOrderItem`（insert or replace by order_id + user_id）、`getOrderItems(orderId)`
- [x] 2.5 在 `src/db/queries.js` 實作 Payment CRUD：`upsertPayment`（insert or replace by order_id + user_id）、`getPayments(orderId)`、`markPaid(orderId, userName)`
- [x] 2.6 在 `src/db/queries.js` 實作 Session CRUD：`setSession(userId, state, data)`、`getSession(userId)`、`clearSession(userId)` — 支援菜單建立流程：多輪對話（conversational wizard）

## 3. LINE Bot 介面層

- [x] 3.1 在 `src/index.js` 建立 Express server，掛載 LINE middleware（webhook signature verification）；路由 `POST /webhook` 處理事件陣列 — 實作 Webhook Signature Verification
- [x] 3.2 在 `src/bot/handlers.js` 實作事件分流：`message` 事件 → 指令路由，`postback` 事件 → postback handler — 實作 Organizer Command Routing
- [x] 3.3 在 `src/bot/handlers.js` 實作指令解析：以前綴匹配 `/新增訂單`、`/統計`、`/確認下單`、`/已收款`、`/收款狀態`，wizard session 中的訊息轉交 wizard handler，其餘靜默忽略 — 實作 LINE Bot 互動模式：指令 + postbackAction
- [x] 3.4 在 `src/bot/handlers.js` 實作 postback 解析：以 query string 解析 `data`，依 `action` 欄位分派至 `select_item` 或 `set_payment` handler — 實作 Postback Event Handling，遵循 Postback 資料格式（`action=select_item&order_id=<id>&item_id=<id>`）
- [x] 3.5 在 `src/bot/messages.js` 實作 Flex Message Menu Rendering：`buildMenuFlexMessage(order, menuItems)` 回傳 LINE Flex Message JSON，header 顯示餐廳名稱，每個菜單項目一個 Quick Reply button，postback data 格式 `action=select_item&order_id=<id>&item_id=<id>`

## 4. 訂餐功能

- [x] 4.1 在 `src/bot/commands.js` 實作 Create Order Session：處理 `/新增訂單 <restaurant>` — 檢查無 active order，建立 order 記錄，啟動 wizard session，回覆提示輸入第一個菜單項目
- [x] 4.2 在 `src/bot/commands.js` 實作菜單建立流程：多輪對話（conversational wizard）— 解析 `<名稱> <價格>` 格式存入 menu_items；收到空訊息或 `/完成` 時結束 wizard、清除 session、呼叫 `buildMenuFlexMessage` 發送菜單
- [x] 4.3 在 `src/bot/commands.js` 實作 Select Menu Item：處理 `action=select_item` postback — 驗證 order 狀態為 `open`，呼叫 `upsertOrderItem`，回覆確認訊息含品項名稱與價格
- [x] 4.4 在 `src/bot/commands.js` 實作 View Order Tally：處理 `/統計` — 查詢 order_items join menu_items，格式化列表（姓名、品項、金額）與合計，回覆群組；無選餐時回覆提示訊息
- [x] 4.5 在 `src/bot/commands.js` 實作 Confirm Order：處理 `/確認下單` — 驗證 order 狀態為 `open` 且有選餐，呼叫 `updateOrderStatus('confirmed')`，觸發 Send Payment Notifications

## 5. 收款追蹤

- [x] 5.1 在 `src/bot/commands.js` 實作 Send Payment Notifications：order confirmed 後，查詢所有 order_items，發送群組訊息列出每人姓名、品項、應付金額，附 Quick Reply buttons（現金、轉帳、LINE Pay），postback data 格式 `action=set_payment&order_id=<id>&method=<method>`
- [x] 5.2 在 `src/bot/commands.js` 實作 Record Payment Method：處理 `action=set_payment` postback — 驗證成員未被標記為已付，呼叫 `upsertPayment`（method），回覆確認；若已標記付款則回覆提示
- [x] 5.3 在 `src/bot/commands.js` 實作 Mark Member as Paid：處理 `/已收款 <name>` — 以 display name（case-insensitive）查找 payment 記錄，呼叫 `markPaid`，回覆確認；名稱不符時列出有效名單
- [x] 5.4 在 `src/bot/commands.js` 實作 View Payment Status：處理 `/收款狀態` — 驗證 order 狀態為 `confirmed`，查詢 payments，格式化列表（姓名、付款方式、已付/未付），回覆群組

## 6. 部署與驗證

- [x] 6.1 在 `package.json` 加入 `start` script（`node src/index.js`）；建立 `README.md` 說明 LINE Developer Console 設定步驟、`.env` 填寫方式、本地以 `ngrok` 建立 HTTPS tunnel 並設定 webhook URL
- [x] 6.2 本地端對端驗證：主辦人傳 `/新增訂單 老媽便當` → 多輪輸入菜單 → Flex Message 發送 → 以測試帳號選餐 → `/統計` 確認統計正確
- [x] 6.3 確認下單流程驗證：`/確認下單` → 收款通知發送 → 各人選付款方式 → `/已收款 xxx` → `/收款狀態` 確認更新正確
