## 1. 建立 auth 共用模組（決策 1：抽出 src/bot/auth.js 共用模組）

- [x] 1.1 新增 `src/bot/auth.js`：從 `handlers.js` 複製 `ORGANIZER_IDS` 與 `isOrganizer(userId)` 邏輯並 export
- [x] 1.2 更新 `src/bot/handlers.js`：刪除 `ORGANIZER_IDS` 與 `isOrganizer` 定義，改為 `const { isOrganizer } = require('./auth')`

## 2. 指令提示依身份顯示（Role-Aware Command Hints，決策 2：HINT 改為函式 hint(type, userId)）

- [x] 2.1 在 `src/bot/commands.js` 頂部加入 `const { isOrganizer } = require('./auth')`
- [x] 2.2 將靜態 `HINT` 物件改為函式 `hint(type, userId)`，依 `isOrganizer(userId)` 分別回傳主辦人版與一般成員版提示字串：
  - `hint('open', userId)`：主辦人含 `/統計`、`/確認下單`、`/取消餐點 <名字>`、`/取消訂單`；一般成員僅含點餐按鈕與 `/取消餐點`
  - `hint('confirmed', userId)`：主辦人含 `/收款狀態`、`/已收款 <名字>`、`/取消訂單`；一般成員僅含付款按鈕提示
  - `hint('wizard', userId)` 與 `hint('none', userId)`：不需條件判斷（皆為主辦人觸發）
- [x] 2.3 將 `commands.js` 中需要顯示提示的函式，把 `+ HINT.<type>` 替換為 `+ hint('<type>', userId)`；並移除不需要提示的函式的 hint 呼叫：
  - **保留提示**：`handleWizardInput`、`selectItem`、`viewTally`、`setPaymentMethod`、`markMemberPaid`、`viewPaymentStatus`、`cancelMyItems`、`cancelNamedItems`、`cancelOrder`
  - **移除提示**：`createOrderSession`（建立訂單的回覆只需操作說明，不附指令提示）、`confirmOrder`（確認下單後立即 push 收款通知，不需額外提示）

## 3. 點選餐點後重推菜單（Select Menu Item，決策 3：點餐後推菜單用 pushMessage）

- [x] 3.1 在 `src/bot/commands.js` 的 `selectItem` 函式中，將 `return replyText(...)` 改為 `await replyText(...)`，接著取得 `sourceId = event.source.groupId || event.source.roomId || event.source.userId`，最後 `return pushMessage(client, sourceId, buildMenuFlexMessage(order, menuItems))`（`order` 與 `menuItems` 在函式前段已 fetch，直接複用）

## 4. 取消餐點後重推菜單（Cancel Own Order Items，決策 3：點餐後推菜單用 pushMessage）

- [x] 4.1 在 `src/bot/commands.js` 的 `cancelMyItems` 函式中，將 `return replyText(...)` 改為 `await replyText(...)`，接著取得 `sourceId`，並呼叫 `db.getMenuItems(order.id)` 取得菜單項目，最後 `return pushMessage(client, sourceId, buildMenuFlexMessage(order, menuItems))`（`order` 在函式前段已 fetch，直接複用）
