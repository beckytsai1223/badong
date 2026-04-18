## Problem

主辦人在 wizard 流程（新增菜單、輸入品項、確認菜單）進行中時，傳送 `/關閉訂單` 不會關閉訂單，而是被當成菜單品項輸入處理，Bot 回覆格式錯誤提示，訂單無法透過此指令關閉。

## Root Cause

`handlers.js` 的 `handleTextMessage` 在偵測到使用者有 active wizard session 時（`adding_items`、`setting_threshold`、`confirming_menu` 狀態），會將所有訊息轉送給 `handleWizardInput`，包含 `/關閉訂單`。`/關閉訂單` 的路由判斷在 wizard 攔截之後，因此永遠不會被觸發。

## Proposed Solution

在 `handlers.js` 的 wizard 攔截邏輯之前，優先判斷 `/關閉訂單`：

1. 若訊息為 `/關閉訂單`，直接呼叫 `cancelOrder`，不進入 wizard 流程
2. `cancelOrder` 在關閉訂單的同時，額外清除該使用者的 wizard session（`db.clearSession(userId)`），避免殘留 session 影響後續操作

## Non-Goals

- 不修改 wizard 流程本身的行為
- 不讓其他指令（如 `/統計`、`/確認下單`）也能在 wizard 中執行；只處理 `/關閉訂單` 這個緊急跳出的情境

## Success Criteria

- 主辦人在 wizard 任意階段（`adding_items`、`setting_threshold`、`confirming_menu`）傳送 `/關閉訂單`，訂單狀態變更為 `closed`，wizard session 被清除
- 主辦人在非 wizard 狀態（`open`、`confirmed` 訂單）傳送 `/關閉訂單`，行為與修改前相同
- 非主辦人傳送 `/關閉訂單`，仍回覆權限錯誤，不執行關閉

## Impact

- Affected specs: `line-bot-interface`
- Affected code: `src/bot/handlers.js`、`src/bot/commands.js`
