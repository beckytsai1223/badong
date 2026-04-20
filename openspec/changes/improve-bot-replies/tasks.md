## 1. 取消餐點顯示名字

- [x] 1.1 [Role-Aware Command Hints] 在 `src/bot/commands.js` 的 `cancelMyItems` 函式中，於 `removeUserOrderItems` 呼叫之前加入 `const displayName = await getDisplayName(client, event);`
- [x] 1.2 [Cancel Meal Reply Uses Display Name] 將回覆文字從 `'✅ 已取消你的餐點選擇，可重新點選。'` 改為 `` `✅ 已取消 ${displayName} 的餐點選擇，可重新點選。` ``

## 2. 付款靜默記錄

- [x] 2.1 [Record Payment Method] [Self-Report Payment] 在 `src/bot/commands.js` 的 `setPaymentMethod` 函式中，移除付款成功後的 `return replyText(client, replyToken, \`✅ 已記錄付款方式：${label}\`);`，改為 `return;`（不回覆任何訊息）
- [x] 2.2 確認重複點按的錯誤提示（`'您已選擇付款方式，選擇後無法更改。'`）保持不變

## 3. 統計品項彙總

- [x] 3.1 [Tally Item Count Summary] 在 `src/bot/commands.js` 的 `viewTally` 函式中，於合計行 push 之後，新增品項彙總邏輯：以 `item_name` 為 key 統計出現次數，生成格式為 `{item_name}：N 份` 的每一行
- [x] 3.2 將品項彙總區塊（標題 `\n【品項統計】` + 各品項行）append 到 `lines` 陣列，確保出現在合計行之後、外送標準行之前（若有）
- [x] 3.3 確認品項數量為 0 的品項不出現在彙總中（只取 count ≥ 1 的項目）
