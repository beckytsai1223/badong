## Context

目前系統：
- 付款確認 Flex Message 使用單行 horizontal layout（name/items/amount 三欄），`amount` 的 `flex:1` 在品項較多時被嚴重擠壓
- `viewPaymentStatus` 僅查 `payments` 表，未回報的同仁不出現
- 訂單建立時不記錄外送相關資訊，`/統計` 只顯示品項明細，無法判斷是否達到外送門檻
- `orders` 表無 `delivery_threshold` 欄位；DB 使用 `CREATE TABLE IF NOT EXISTS`，不會自動加新欄位

## Goals / Non-Goals

**Goals:**
- 修正付款確認 Flex Message 版面，確保金額在所有螢幕寬度下可見
- `/收款狀態` 顯示所有訂餐同仁（含未回報者），排除主辦人
- 新增訂單 wizard 可選填外送標準金額；`/統計` 反映達標狀態

**Non-Goals:**
- 不記錄外送費金額本身（只記錄免外送門檻）
- 不改變付款通知的推送時機或觸發條件

## Decisions

### 付款確認 Flex Message 版面改為每人垂直兩行

每位成員顯示為 vertical box：
- 第一行（horizontal）：`name` flex:1 + `$amount` flex:1，各佔一半，amount 靠右對齊
- 第二行：品項文字，`size: 'sm'`、`color: '#888888'`、`wrap: true`

理由：single-row 三欄時 flex:1 的金額無法保留足夠寬度；分兩行後名字與金額各佔 50%，不互相擠壓。

### 收款狀態改以 order_items 為基準

查詢步驟：
1. `db.getOrderItems(order.id)` — 取得所有訂餐者的 `user_id` / `user_name`（去重）
2. `db.getPayments(order.id)` — 取得付款記錄
3. Left join：有 payment record 且 `paid=1` → 顯示 methodLabel；無記錄或 `paid=0` → 顯示「未選擇｜未付」
4. 過濾 `method === 'organizer'` 的記錄（主辦人自動付款，不顯示）

統計分母改為「訂餐人數（扣除主辦人）」。

### 外送標準：orders 表新增欄位 + ALTER TABLE 遷移

`orders` 表新增 `delivery_threshold INTEGER DEFAULT NULL`。  
由於線上 DB 已存在，在 `initSchema()` 末尾加：
```sql
ALTER TABLE orders ADD COLUMN delivery_threshold INTEGER DEFAULT NULL;
```
SQLite 的 `ALTER TABLE ADD COLUMN` 若欄位已存在會拋錯，用 try/catch 忽略即可（冪等）。

### 外送標準 Wizard 新增 setting_threshold 狀態

現有 wizard 狀態機：`adding_items`  
新狀態機：`setting_threshold` → `adding_items`

流程：
1. `createOrderSession` 建完訂單後，session state 設為 `setting_threshold`（data 同 `{ orderId, restaurantName }`）
2. `handlers.js` session check 條件擴充：`session.state === 'adding_items' || session.state === 'setting_threshold'` 都轉發給 `handleWizardInput`
3. `handleWizardInput` 新增 `setting_threshold` 分支：
   - 輸入純數字 → 呼叫 `db.setDeliveryThreshold(orderId, value)`，切換 state 為 `adding_items`，回覆「外送標準設為 $N，請輸入菜單...」
   - 輸入 `/略過` 或空白 → 不設門檻，切換 state 為 `adding_items`，直接進入菜單輸入
   - 其他輸入 → 回覆格式提示，保持 `setting_threshold` 狀態

### /統計 顯示外送標準達標狀態

若 `order.delivery_threshold` 為 null → 不顯示外送資訊  
若有值：
- `grandTotal >= threshold` → 顯示「✅ 已達外送標準（$N）」
- `grandTotal < threshold` → 顯示「⚠️ 距外送標準還差 $M（標準：$N）」

## Risks / Trade-offs

- [Risk] `ALTER TABLE ADD COLUMN` 在 SQLite 若有 DEFAULT 以外的約束會失敗 → Mitigation：只用 `DEFAULT NULL`，無約束，SQLite 完全支援
- [Risk] `setting_threshold` 狀態下若 bot 重啟，session 仍在 DB，回覆任何訊息都會進 wizard → Mitigation：已有 `clearSession` 邏輯，行為一致；不需特別處理
- [Risk] `getOrderItems` 去重邏輯需正確（同一人多道菜只計一次）→ Mitigation：在 query layer 用 `GROUP BY user_id` 或在 JS 用 Set 去重
