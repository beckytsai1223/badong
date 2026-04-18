## 1. 修正 Organizer Command Routing — /關閉訂單 優先於 wizard 攔截

- [x] 1.1 依據 Organizer Command Routing 規格，在 `src/bot/handlers.js` 的 `handleTextMessage` 函式中，將 `/關閉訂單` 的路由判斷移至 wizard session 攔截邏輯（`if (session && ...)`）之前：當 `text === '/關閉訂單'` 且 `isOrganizer(userId)` 時，呼叫 `commands.cancelOrder(event, client)`；若非主辦人，回覆「只有主辦人可以關閉訂單。」
- [x] 1.2 同時從下方原有的 organizer-only 群組判斷中移除 `/關閉訂單`（避免重複路由）

## 2. 確保 cancelOrder 清除 wizard session

- [x] 2.1 確認 `src/bot/commands.js` 的 `cancelOrder` 函式已呼叫 `db.clearSession(userId)`（目前已有，確認即可，若無則補上）

## 3. 驗證

- [x] 3.1 手動測試：主辦人在 wizard 輸入品項階段（`adding_items`）傳送 `/關閉訂單`，確認訂單關閉、session 清除、回覆確認訊息
- [x] 3.2 手動測試：主辦人在非 wizard 狀態（open 訂單）傳送 `/關閉訂單`，確認行為與修改前相同
- [x] 3.3 手動測試：非主辦人傳送 `/關閉訂單`，確認收到權限錯誤，訂單不關閉
