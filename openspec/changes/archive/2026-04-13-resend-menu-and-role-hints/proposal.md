## Why

點餐後菜單訊息會被後續對話推擠到上方，新加入的群組成員需往上滑才能找到菜單點餐；同時，所有人的指令提示都顯示主辦人專屬指令，造成一般成員混淆。

## What Changes

- 每次有人成功選餐後，Bot 自動 push 一張新的菜單 Flex Message 到群組底部，讓菜單維持可見
- 取消自己選餐（`/取消餐點`）後，同樣 push 菜單，方便立即重選
- 指令提示依使用者身份區分：主辦人看到完整的主辦人指令；一般成員只看到自己可以使用的指令
- 新增 `src/bot/auth.js` 作為主辦人身份判斷的共用模組（原本邏輯在 `handlers.js`，`commands.js` 無法存取）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `line-bot-interface`：`select_item` postback 處理後新增 push 菜單行為；所有文字指令回覆的提示區塊依身份顯示不同內容
- `lunch-ordering`：`/取消餐點`（無名字）執行後新增 push 菜單行為

## Impact

- 新增檔案：`src/bot/auth.js`
- 修改檔案：`src/bot/commands.js`、`src/bot/handlers.js`
