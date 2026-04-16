## 1. 修改點餐確認回覆 [Role-Aware Command Hints]

- [x] 1.1 [Role-Aware Command Hints] 在 `src/bot/commands.js` 的 `selectItem` 函式中，將 `+ hint('open', userId)` 替換為固定字串 `'\n\n/取消餐點 → 取消自己的選餐重選'`，使回覆對主辦人與一般同仁皆只顯示此單行提示

## 2. 移除統計回覆的提示區塊 [Role-Aware Command Hints]

- [x] 2.1 在 `src/bot/commands.js` 的 `viewTally` 函式中，移除 `const tallyHint = hint(...)` 及其在 `replyText` 中的 `+ tallyHint` 串接，使 `/統計` 回覆不再附帶任何可用指令區塊

## 3. 移除收款狀態回覆的提示區塊 [Role-Aware Command Hints]

- [x] 3.1 在 `src/bot/commands.js` 的 `viewPaymentStatus` 函式中，移除回覆末尾的 `+ hint('confirmed', event.source.userId)`，使 `/收款狀態` 回覆不再附帶任何可用指令區塊

## 4. 移除付款方式選擇回覆的提示區塊 [Role-Aware Command Hints]

- [x] 4.1 在 `src/bot/commands.js` 的 `setPaymentMethod` 函式中，移除回覆末尾的 `+ hint('confirmed', userId)`，使付款方式確認回覆不再附帶任何可用指令區塊

## 5. 在付款通知 Flex Message 新增操作說明 [Send Payment Notifications]

- [x] 5.1 [Send Payment Notifications] 在 `src/bot/messages.js` 的 `buildPaymentNotificationMessage` 函式中，於 `footer.contents` 陣列的最前面插入一個 `type: 'text'` 元素，文字內容為 `請同仁付完款後，直接點選以下的付款方式`，使其出現在三個付款按鈕上方
