## Context

目前 `orders` 資料表只有 `restaurant_name`、`status`、`created_by`、`created_at`、`delivery_threshold` 欄位。Wizard 流程目前有兩個步驟：`setting_threshold`（詢問外送標準）→ `adding_items`（輸入品項）→ `confirming_menu`（確認）。

菜單 Flex Message header 固定顯示 `🍱 <restaurant_name>`，無副標題。

## Goals / Non-Goals

**Goals:**

- 在 wizard 開頭新增 `setting_meal_label` 狀態，讓主辦人可以輸入餐點說明（自由文字）或 `/略過`
- 在 `setting_meal_label` 之後新增 `setting_deadline` 狀態，讓主辦人可以輸入點餐截止時間（自由文字）或 `/略過`
- 將 meal_label 持久化至 `orders.meal_label` 欄位
- 將 order_deadline 持久化至 `orders.order_deadline` 欄位
- 菜單 header 顯示 `🍱 便當店｜明天午餐`（有 label）或 `🍱 便當店`（無 label）
- 菜單 header 固定顯示副標題：`請直接在下方點選點餐`
- 菜單 header 顯示第三行截止時間（有設定才顯示）：`⏰ 截止：<order_deadline>`

**Non-Goals:**

- 不驗證 meal_label 或 order_deadline 的格式或長度
- 不支援建立訂單後修改 meal_label 或 order_deadline
- 不自訂副標題文字
- 截止時間僅供顯示，不觸發自動鎖單或提醒

## Decisions

### 1. Wizard 狀態順序

新狀態依序插入在最前面：`setting_meal_label` → `setting_deadline` → `setting_threshold` → `adding_items` → `confirming_menu`

理由：meal_label 和 order_deadline 都是訂單的識別資訊，應最早收集；且與外送標準一樣屬於「建立時設定、之後不改」的資料。

### 2. 資料儲存方式

在 `orders` 資料表新增兩個欄位：
- `meal_label TEXT DEFAULT NULL`
- `order_deadline TEXT DEFAULT NULL`

兩者均採用與 `delivery_threshold` 相同的 migration 模式（`ALTER TABLE ... ADD COLUMN`，以 try/catch 包覆保持冪等性）。

`db.createOrder()` 簽名改為 `createOrder(restaurant, userId, mealLabel = null)`，meal_label 可選，預設 null。order_deadline 透過獨立的 `updateOrderDeadline(orderId, deadline)` 函式更新（與 updateOrderMealLabel 模式相同）。

### 3. Header 渲染

`buildMenuFlexMessage(order, menuItems)` 中，header contents 陣列動態組裝：

- **第一個**（標題）：`order.meal_label ? \`🍱 ${order.restaurant_name}｜${order.meal_label}\` : \`🍱 ${order.restaurant_name}\``，`weight: 'bold'`、`size: 'xl'`、`color: '#ffffff'`
- **第二個**（固定副標題）：固定文字 `請直接在下方點選點餐`，`size: 'sm'`、`color: '#cce4f7'`、`wrap: true`
- **第三個**（截止時間，條件顯示）：僅當 `order.order_deadline` 有值時加入，文字 `` `⏰ 截止：${order.order_deadline}` ``，`size: 'sm'`、`color: '#cce4f7'`、`wrap: true`

## Risks / Trade-offs

- **既有訂單**：migration 後舊訂單 `meal_label` 和 `order_deadline` 均為 NULL，渲染時走無值分支，不影響既有功能
- **Wizard 中斷**：主辦人在 `setting_meal_label` 或 `setting_deadline` 狀態傳送 `/關閉訂單` 時，已由 `close-order-anywhere` change 處理，會正確清除 session
