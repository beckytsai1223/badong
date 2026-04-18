## 1. 資料庫：新增 meal_label 與 order_deadline 欄位

- [x] 1.1 依據資料儲存方式設計，在 `src/db/schema.js` 的 `initSchema()` migration 區塊，仿照 `delivery_threshold` 的模式，以 try/catch 包覆新增：`ALTER TABLE orders ADD COLUMN meal_label TEXT DEFAULT NULL`
- [x] 1.2 依據資料儲存方式設計，在 `src/db/schema.js` 的 `initSchema()` migration 區塊，仿照 `delivery_threshold` 的模式，以 try/catch 包覆新增：`ALTER TABLE orders ADD COLUMN order_deadline TEXT DEFAULT NULL`
- [x] 1.3 依據資料儲存方式設計，在 `src/db/queries.js` 的 `createOrder(restaurant, userId)` 函式，改為 `createOrder(restaurant, userId, mealLabel = null)`，並在 INSERT 語句中加入 `meal_label` 欄位與對應的 `?` 參數

## 2. Wizard 流程：新增 setting_meal_label 與 setting_deadline 狀態（依據 Create Order Session 規格）

- [x] 2.1 依據 Create Order Session 規格與 wizard 狀態順序設計，在 `src/bot/commands.js` 的 `createOrderSession` 函式，將建立訂單後的 session 初始狀態從 `setting_threshold` 改為 `setting_meal_label`，回覆提示改為：`✅ 已建立「${restaurant}」訂單！\n\n請輸入這份訂單的餐點說明（例如：明天午餐、4/18 便當）\n若不需要，請輸入 /略過`
- [x] 2.2 依據 Create Order Session 規格與 wizard 狀態順序設計，在 `src/bot/commands.js` 的 `handleWizardInput` 函式，在 `setting_threshold` 狀態判斷之前新增 `setting_meal_label` 狀態處理：若 `text === '/略過'`，直接不更新 meal_label（建立時預設 null），轉換 session 至 `setting_deadline` 並回覆：`請輸入點餐截止時間（例如：4月18號中午12點）\n若無截止時間，請輸入 /略過`；若為其他文字，以該文字呼叫 `db.updateOrderMealLabel(orderId, text)`，再轉換 session 至 `setting_deadline` 並回覆相同截止時間提示
- [x] 2.3 依據 Create Order Session 規格與 wizard 狀態順序設計，在 `src/bot/commands.js` 的 `handleWizardInput` 函式，在 `setting_meal_label` 處理之後、`setting_threshold` 處理之前新增 `setting_deadline` 狀態處理：若 `text === '/略過'`，直接不更新 order_deadline（建立時預設 null），轉換 session 至 `setting_threshold` 並發送外送標準提示；若為其他文字，以該文字呼叫 `db.updateOrderDeadline(orderId, text)`，再轉換 session 至 `setting_threshold` 並發送外送標準提示
- [x] 2.4 在 `src/db/queries.js` 新增 `updateOrderMealLabel(orderId, mealLabel)` 函式：執行 `UPDATE orders SET meal_label = ? WHERE id = ?`，並加入 `module.exports`
- [x] 2.5 在 `src/db/queries.js` 新增 `updateOrderDeadline(orderId, deadline)` 函式：執行 `UPDATE orders SET order_deadline = ? WHERE id = ?`，並加入 `module.exports`

## 3. 菜單渲染：更新 Flex Message header（依據 Flex Message Menu Rendering 規格）

- [x] 3.1 依據 Flex Message Menu Rendering 規格與 header 渲染設計，在 `src/bot/messages.js` 的 `buildMenuFlexMessage(order, menuItems)` 函式，將 header contents 由單一 text component 改為動態陣列：第一個為標題（`order.meal_label ? \`🍱 ${order.restaurant_name}｜${order.meal_label}\` : \`🍱 ${order.restaurant_name}\``，weight: bold, size: xl, color: '#ffffff'）；第二個為固定副標題（text: '請直接在下方點選點餐'，size: sm，color: '#cce4f7'，wrap: true）；若 `order.order_deadline` 有值，則加入第三個截止時間 component（text: `` `⏰ 截止：${order.order_deadline}` ``，size: sm，color: '#cce4f7'，wrap: true）

## 4. 驗證

- [x] 4.1 手動測試：執行 `/新增訂單 便當店`，確認 Bot 提示輸入餐點說明
- [x] 4.2 手動測試：輸入「明天午餐」後，確認 Bot 繼續詢問截止時間
- [x] 4.3 手動測試：輸入「4月18號中午12點」後，確認 Bot 繼續詢問外送標準，流程正常完成，菜單標題顯示「🍱 便當店｜明天午餐」、副標題「請直接在下方點選點餐」、截止時間「⏰ 截止：4月18號中午12點」
- [x] 4.4 手動測試：在截止時間步驟輸入 `/略過`，確認菜單 header 不顯示截止時間行，其他行正常出現
- [x] 4.5 手動測試：在餐點說明步驟輸入 `/略過`，確認流程正常繼續至截止時間詢問，菜單標題只顯示「🍱 便當店」
