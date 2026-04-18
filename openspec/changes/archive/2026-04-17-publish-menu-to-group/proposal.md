## Why

主辦人在私聊建立訂單後，菜單只會出現在私聊對話框，群組成員無法看到也無法點餐。需要一個明確的指令讓主辦人能將菜單推送至群組，開放群組成員點餐。

## What Changes

- 新增 `/發布菜單` 指令（僅限主辦人使用）
- 主辦人在群組傳送 `/發布菜單` 後，Bot 取得當前群組的 `groupId`，並將目前進行中的訂單菜單以 Flex Message 形式 push 至該群組
- 若目前沒有進行中的訂單（`open` 狀態），回覆錯誤提示

## Non-Goals

- 不自動偵測主辦人加入群組時推送菜單（需主辦人主動觸發）
- 不支援同時對多個群組推送（一次只推送至觸發該指令的群組）
- 不修改私聊建立訂單的流程

## Capabilities

### New Capabilities

（無，此功能屬於現有 line-bot-interface 的指令擴充）

### Modified Capabilities

- `line-bot-interface`：新增 `/發布菜單` 指令路由及對應的處理邏輯
- `lunch-ordering`：訂單開放點餐的觸發方式新增「主辦人在群組執行 `/發布菜單`」

## Impact

- Affected specs: `line-bot-interface`、`lunch-ordering`
- Affected code: `src/bot/handlers.js`（新增指令路由）、`src/bot/commands.js`（新增 `publishMenu` 函式）
