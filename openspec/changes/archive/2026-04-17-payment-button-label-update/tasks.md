## 1. 更新付款按鈕標籤（依據 Payment Notification Text 規格）

- [x] 1.1 依據 Payment Notification Text 規格，在 `src/bot/messages.js` 的 `buildPaymentNotificationMessage` 函式，將 `methods` 陣列中的三個 `label` 從 `'現金'` `'轉帳'` `'LINE Pay'` 分別改為 `'已完成現金付款'` `'已完成轉帳付款'` `'已完成 LINE Pay 付款'`

## 2. 驗證

- [x] 2.1 手動測試：執行 `/確認下單`，確認推送至群組的付款確認 Flex Message 中，三個按鈕標籤分別顯示「已完成現金付款」「已完成轉帳付款」「已完成 LINE Pay 付款」
