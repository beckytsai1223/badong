## 1. 發布菜單改用 Reply

- [x] 1.1 修改 `publishMenu()`（`src/bot/commands.js`）：移除 `pushMessage(client, groupId, flexMsg)` 呼叫，改以單次 `client.replyMessage({ replyToken, messages: [flexMsg, { type: 'text', text: '✅ 菜單已發布至群組。' }] })` 取代原本的 `pushMessage` + `replyText` 兩次呼叫，實現「Publish Menu to Group」需求

## 2. 點餐確認與菜單重新顯示改用 Reply

- [x] 2.1 修改 `selectItem()`（`src/bot/commands.js`）：移除 `pushMessage(client, sourceId, buildMenuFlexMessage(...))` 呼叫，將確認文字與菜單 Flex Message 合併為單次 `client.replyMessage({ replyToken, messages: [{ type: 'text', text: confirmationText }, menuFlexMsg] })`，實現「Menu Re-display After Item Selection」需求

## 3. 收款通知改用 Reply

- [x] 3.1 修改 `confirmOrder()`（`src/bot/commands.js`）：移除 `pushMessage(client, sourceId, paymentMsg)` 呼叫，將訂單確認文字與收款通知 Flex Message 合併為單次 `client.replyMessage({ replyToken, messages: [{ type: 'text', text: confirmationText }, paymentMsg] })`，實現「Payment Notification Text」需求

## 4. 驗證

- [x] 4.1 確認 `src/bot/commands.js` 中不再有任何 `pushMessage` 呼叫用於菜單或收款通知（可保留 `pushMessage` helper 函式本身）
- [x] 4.2 手動測試：發布菜單、點餐、確認下單，確認所有訊息正確出現於群組且無錯誤
