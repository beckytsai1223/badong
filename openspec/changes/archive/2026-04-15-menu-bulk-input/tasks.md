## 1. Wizard 狀態機擴充

- [x] 1.1 修改 `src/bot/handlers.js` 的 session state 判斷：將條件擴充為 `session.state === 'adding_items' || session.state === 'setting_threshold' || session.state === 'confirming_menu'`，確保三種狀態都轉發至 `handleWizardInput`

## 2. 多行批次輸入與預覽確認

- [x] 2.1 [Create Order Session] 修改 `src/bot/commands.js` 的 `handleWizardInput` `adding_items` 分支：以換行符切割 `text`，過濾空行，對每一行執行 `/^(.+?)\s+(\d+)$/` 解析；若任一行不符格式，回覆列出所有不合格行（格式：`第 N 行：<原始內容>`）並保持 `adding_items`；若全部合法，將品項陣列存入 session data（`{ orderId, restaurantName, pendingItems: [{name, price}] }`）並切換 state 為 `confirming_menu`，回覆已解析的品項清單（每行 `品名 $金額`）並說明「請確認以上菜單，輸入 /確認 建立，或重新輸入整份菜單。」
- [x] 2.2 [Create Order Session] 在 `src/bot/commands.js` 的 `handleWizardInput` 新增 `confirming_menu` 分支：若 `text === '/確認'`，批次呼叫 `db.addMenuItem` 儲存 `session.data.pendingItems` 所有品項，呼叫 `db.clearSession`，取得菜單並發送 `buildMenuFlexMessage`；若 text 含換行（多行輸入），重新解析——全部合法則更新 session data 的 `pendingItems`、保持 `confirming_menu`、回覆新的品項預覽；任一行格式錯誤則回覆錯誤行清單並保持 `confirming_menu`
- [x] 2.3 [Create Order Session] 更新 `src/bot/commands.js` 的 `setting_threshold` 分支（設定與略過兩個路徑）中切換至 `adding_items` 後的提示文字，改為說明多行輸入格式：「請一次輸入所有菜單品項，每行一個，格式：品名 金額\n範例：\n排骨飯 80\n雞腿飯 90」
