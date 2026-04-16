## 1. 資料庫 Schema 遷移

- [x] 1.1 [外送標準：orders 表新增欄位 + ALTER TABLE 遷移] 在 `src/db/schema.js` 的 `initSchema()` 末尾加入 `ALTER TABLE orders ADD COLUMN delivery_threshold INTEGER DEFAULT NULL`，用 try/catch 忽略欄位已存在的錯誤（冪等）

## 2. 資料庫查詢函式

- [x] 2.1 [Set Delivery Threshold] 在 `src/db/queries.js` 新增 `setDeliveryThreshold(orderId, value)` 函式：執行 `UPDATE orders SET delivery_threshold = ? WHERE id = ?`，並加入 `module.exports`
- [x] 2.2 [View Payment Status] 在 `src/db/queries.js` 確認 `getOrderItems(orderId)` 回傳結果含 `user_id` 與 `user_name`，可用於收款狀態的左連結基準

## 3. 付款通知 Flex Message 版面修正

- [x] 3.1 [付款確認 Flex Message 版面改為每人垂直兩行] [Send Payment Notifications] 修改 `src/bot/messages.js` 的 `buildPaymentNotificationMessage`：將 `userRows` 改為 vertical box 每人兩行——第一行（horizontal）`name(flex:1)` + `$amount(flex:1, align:end)`，第二行品項文字（`size:'sm'`、`color:'#888888'`、`wrap:true`）

## 4. 付款方式選取保護

- [x] 4.1 [Record Payment Method] 修改 `src/bot/commands.js` 的 `setPaymentMethod`：在 `db.upsertPayment` 之前先查詢該用戶是否已有 `paid=1` 的記錄；若已付則回覆「您已選擇付款方式，選擇後無法更改。」並 return，不更新記錄

## 5. 收款狀態完整顯示

- [x] 5.1 [收款狀態改以 order_items 為基準] [View Payment Status] 修改 `src/bot/commands.js` 的 `viewPaymentStatus`：改為先呼叫 `db.getOrderItems(order.id)` 取得所有訂餐者（`user_id`/`user_name` 去重），再呼叫 `db.getPayments(order.id)` 取得付款記錄，左連結後過濾 `method === 'organizer'`；有 `paid=1` 記錄者顯示付款方式 label，無記錄或 `paid=0` 者顯示「未選擇｜未付」；統計分母改為非主辦人訂餐人數

## 6. 外送標準 Wizard 步驟

- [x] 6.1 [外送標準 Wizard 新增 setting_threshold 狀態] [Create Order Session] 修改 `src/bot/commands.js` 的 `createOrderSession`：建立訂單後將 session state 設為 `setting_threshold`（data 保持 `{ orderId, restaurantName }`），並回覆提示輸入外送標準金額或 `/略過`
- [x] 6.2 [Set Delivery Threshold] 在 `src/bot/commands.js` 的 `handleWizardInput` 新增 `setting_threshold` 分支：輸入純數字 → 呼叫 `db.setDeliveryThreshold(orderId, value)` 並切換 state 為 `adding_items`，回覆「外送標準設為 $N，請輸入菜單...」；輸入 `/略過` 或空白 → 不設門檻，直接切換 state 為 `adding_items`；其他輸入 → 回覆格式提示，保持 `setting_threshold` 狀態
- [x] 6.3 [外送標準 Wizard 新增 setting_threshold 狀態] 修改 `src/bot/handlers.js` 的 session 條件判斷：將 `session.state === 'adding_items'` 擴充為 `session.state === 'adding_items' || session.state === 'setting_threshold'`，確保兩種狀態都轉發至 `handleWizardInput`

## 7. 移除「標記已付款」功能

- [x] 7.1 [Mark Member as Paid] 確認 `/已收款` 指令路由已在前一個 change（close-order-ux）中移除；驗證 `src/bot/handlers.js` 與 `src/bot/commands.js` 中不含 `/已收款` 路由或 `markMemberPaid` 函式

## 8. 統計顯示外送標準達標狀態

- [x] 8.1 [/統計 顯示外送標準達標狀態] [Display Delivery Threshold Status in Tally] [View Order Tally] 修改 `src/bot/commands.js` 的 `viewTally`：計算 `grandTotal` 後，若 `order.delivery_threshold` 不為 null，附加達標狀態字串——達標顯示「✅ 已達外送標準（$N）」，未達標顯示「⚠️ 距外送標準還差 $M（標準：$N）」；若為 null 則不附加任何外送資訊
