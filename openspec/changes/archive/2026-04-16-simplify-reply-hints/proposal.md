## Why

Bot 回覆訊息末尾附帶的可用指令提示，對實際使用情境中的同仁造成干擾，且部分關鍵操作說明（如付款確認按鈕的使用方式）缺乏清楚引導。精簡回覆內容、補充必要說明，可提升群組使用體驗。

## What Changes

- 點餐確認回覆（同仁選餐後）：移除全部可用指令清單，僅保留 `/取消餐點 → 取消自己的選餐重選` 一行提示
- `/統計` 回覆：完全移除末尾的可用指令區塊
- `/收款狀態` 回覆：完全移除末尾的可用指令區塊
- 選擇付款方式回覆：完全移除末尾的可用指令區塊
- 付款確認 Flex Message：在付款按鈕上方新增說明文字「請同仁付完款後，直接點選以下的付款方式」

## Non-Goals

- 不修改主辦人專屬指令（`/新增訂單`、`/確認下單`、`/關閉訂單`）的回覆內容
- 不調整 `/help` 指令的輸出
- 不修改取消餐點（`/取消餐點`）後的回覆
- 不變更訂單確認（`/確認下單`）後的文字回覆內容

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `line-bot-interface`：點餐確認、統計、收款狀態、付款方式選擇等回覆的訊息格式調整
- `payment-tracking`：付款確認 Flex Message 新增操作說明文字

## Impact

- Affected specs: `line-bot-interface`, `payment-tracking`
- Affected code: `src/bot/commands.js`, `src/bot/messages.js`
