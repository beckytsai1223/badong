## 1. 實作：移除 Role-Aware Command Hints

- [x] 1.1 依據 Role-Aware Command Hints 規格，在 `src/bot/commands.js` 的 `cancelMyItems` 函式（line 416）中，移除回覆字串結尾的 `+ hint('open', userId)`
- [x] 1.2 依據 Role-Aware Command Hints 規格，在 `src/bot/commands.js` 的 `cancelNamedItems` 函式（line 443）中，移除回覆字串結尾的 `+ hint('open', userId)`

## 2. 驗證

- [ ] 2.1 手動測試：以一般同仁身份傳送 `/取消餐點`，確認回覆不含「📌 可用指令」區段
- [ ] 2.2 手動測試：以主辦人身份傳送 `/取消餐點 <名字>`，確認回覆不含「📌 可用指令」區段
- [ ] 2.3 確認其他指令（`/關閉訂單`、`/統計` 等）的回覆行為未受影響
