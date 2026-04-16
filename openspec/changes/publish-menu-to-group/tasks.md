## 1. 實作 Publish Menu to Group 指令

- [x] 1.1 依據 Publish Menu to Group 及 Menu Publication Trigger 規格，在 `src/bot/commands.js` 新增 `publishMenu(event, client)` 函式：取得 `event.source.groupId`，若非群組來源則回覆錯誤；查詢 active order（`open` 狀態），若不存在回覆「目前沒有開放中的訂單可以發布。」；取得 menuItems，呼叫 `buildMenuFlexMessage` 並以 `pushMessage(client, groupId, flexMsg)` 推送至群組；最後 reply 主辦人「✅ 菜單已發布至群組。」
- [x] 1.2 將 `publishMenu` 加入 `module.exports`

## 2. 實作 Organizer Command Routing（/發布菜單）

- [x] 2.1 依據 Organizer Command Routing 規格，在 `src/bot/handlers.js` 新增路由：當 `text === '/發布菜單'` 時，先檢查 `isOrganizer(userId)`，若非主辦人回覆「只有主辦人可以發布菜單。」；否則呼叫 `commands.publishMenu(event, client)`

## 3. 更新 /help 說明

- [x] 3.1 在 `src/bot/commands.js` 的 `helpMessage` 函式中，於主辦人版本的「訂餐管理」區段新增一行：`/發布菜單 → 將菜單推送至群組（主辦人）`，放在 `/新增訂單` 之後

## 4. 驗證

- [ ] 4.1 手動測試：主辦人在私聊建立訂單後，在群組傳送 `/發布菜單`，確認群組收到菜單 Flex Message
- [ ] 4.2 手動測試：非主辦人傳送 `/發布菜單`，確認收到錯誤回覆，群組不出現菜單
- [ ] 4.3 手動測試：無進行中訂單時傳送 `/發布菜單`，確認收到「目前沒有開放中的訂單可以發布。」
- [ ] 4.4 手動測試：主辦人傳送 `/help`，確認回覆中包含「/發布菜單 → 將菜單推送至群組（主辦人）」
