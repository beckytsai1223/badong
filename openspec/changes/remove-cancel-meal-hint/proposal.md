## Why

同仁執行「/取消餐點」後，系統回覆中附帶的「📌 可用指令」清單對使用者而言是多餘的雜訊：取消後菜單立即重新推送，同仁可直接點選，無需再次提示可用指令。

## What Changes

- 移除 `cancelMyItems` 回覆結尾的 `hint('open', userId)` 呼叫
- 移除 `cancelNamedItems` 回覆結尾的 `hint('open', userId)` 呼叫

## Non-Goals

- 不修改其他指令（如 `/統計`、`/新增訂單` 等）的 hint 行為
- 不修改 `hint()` 函式本身
- 不調整 `selectItem` 回覆中的 inline 提示文字

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `line-bot-interface`：`/取消餐點` 指令的回覆內容不再包含可用指令清單

## Impact

- Affected specs: `line-bot-interface`
- Affected code: `src/bot/commands.js`（line 416、443）
