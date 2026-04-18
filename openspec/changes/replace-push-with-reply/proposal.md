## Why

LINE Messaging API 的 Push Message 會消耗每月免費額度，而 Reply Message 完全免費。目前程式碼在三個地方使用 `pushMessage`，其中兩個實際上可以合併進同一個 `replyMessage` 呼叫，無需動用額度。

## What Changes

- `publishMenu()`：移除 `pushMessage` 呼叫，改用單次 `replyMessage` 同時送出菜單 Flex Message 與確認文字訊息（兩則合一）
- `selectItem()`：移除點餐後重推菜單的 `pushMessage` 呼叫，改用單次 `replyMessage` 同時送出確認文字與菜單 Flex Message（兩則合一）
- `confirmOrder()`：移除 `pushMessage` 送收款通知的呼叫，改用單次 `replyMessage` 同時送出確認文字與收款通知 Flex Message（兩則合一）

## Non-Goals

- 不改變任何訊息的內容或格式
- 不調整 Bot 的業務邏輯或點餐流程
- 保留 `pushMessage` helper 函式本身（可供未來真正需要 push 的情境使用）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `line-bot-interface`：訊息傳送機制由 push + reply 雙呼叫改為單次多訊息 reply，減少 API 呼叫次數並消除免費額度消耗

## Impact

- Affected specs: `line-bot-interface`
- Affected code: `src/bot/commands.js`（`publishMenu`、`selectItem`、`confirmOrder` 三個函式）
