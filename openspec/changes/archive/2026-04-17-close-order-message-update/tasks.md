## 1. 更新關閉訂單回覆訊息（依據 Cancel Order Reply 規格）

- [x] 1.1 依據 Cancel Order Reply 規格，在 `src/bot/commands.js` 的 `cancelOrder` 函式，將回覆訊息由 `` `❌ 訂單「${order.restaurant_name}」已取消。` + hint('none', userId) `` 改為 `` `🔒 訂單「${order.restaurant_name}」已關閉。` ``（移除 hint 呼叫、將 ❌ 改為 🔒、將「已取消」改為「已關閉」）

## 2. 驗證

- [x] 2.1 手動測試：建立訂單後執行 `/關閉訂單`，確認回覆訊息為「🔒 訂單「XXX」已關閉。」，且不含「可用指令」區塊
