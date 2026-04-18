## Why

付款確認 Flex Message 的按鈕標籤僅顯示付款方式名稱（「現金」「轉帳」「LINE Pay」），語意不完整，同仁需自行判斷「點下去代表什麼動作」，容易混淆。改為「已完成 XX 付款」後語意清楚，點選即代表確認已付款。

## What Changes

- `src/bot/messages.js` 的 `buildPaymentNotificationMessage` 中，付款按鈕的 `label` 從 `'現金'` `'轉帳'` `'LINE Pay'` 改為 `'已完成現金付款'` `'已完成轉帳付款'` `'已完成 LINE Pay 付款'`

## Non-Goals

- 不修改 `displayText`（點選後顯示給對話框的文字）
- 不修改 postback data 結構（`action=set_payment&...`）
- 不新增或移除付款方式

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `line-bot-interface`：付款確認 Flex Message 按鈕標籤文字變更

## Impact

- Affected specs: `line-bot-interface`
- Affected code:
  - `src/bot/messages.js`（`buildPaymentNotificationMessage` 的 methods 陣列 label 欄位）
