## Why

Bot 目前在幾個互動情境的回覆訊息不夠精確或造成不必要的干擾：取消餐點時用「你的」而非真實姓名、付款登記後發送多餘確認訊息、統計缺少品項彙總數量。

## What Changes

- 取消餐點（`/取消餐點`）：回覆由「已取消你的餐點選擇」改為「已取消 {顯示名稱} 的餐點選擇」
- 付款方式登記成功後：移除「✅ 已記錄付款方式：{方式}」確認訊息，改為靜默記錄；付款資料仍正常寫入 DB；重複點按的錯誤提示保留不變
- `/統計` 輸出：在合計行之後新增品項彙總區塊，格式為「{品項名稱}：N 份」

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `line-bot-interface`：以上三項皆為 LINE Bot 訊息行為調整
- `payment-tracking`：付款登記成功後不再發送確認回覆

## Impact

- 受影響程式碼：`src/bot/commands.js`（`cancelMyItems`、`setPaymentMethod`、`viewTally` 三個函式）
