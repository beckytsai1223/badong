## Why

目前新增訂單 wizard 的菜單輸入需要逐行送出，每道品項都要一則訊息確認，操作繁瑣。主辦人無法一次貼上整份菜單，流程中斷感強。

## What Changes

- **菜單輸入改為單則多行訊息**：主辦人在 `adding_items` 狀態下，一次送出包含所有品項的多行訊息（每行格式 `品名 金額`），系統解析後進入預覽確認步驟
- **預覽確認步驟**：解析成功後，系統回覆已解析的品項清單並詢問是否正確。主辦人送出 `/確認` 則儲存並發送點餐 Flex；若重新輸入新的多行訊息，則以新內容取代，再次進入預覽確認
- **全部拒絕驗證**：只要訊息中任一行格式有誤，全部不儲存，回覆含錯誤行提示，讓主辦人重新輸入整批
- **提示文字更新**：進入 `adding_items` 與 `confirming_menu` 狀態的提示文字更新

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `lunch-ordering`: Create Order Session wizard 的 `adding_items` 輸入行為改為支援單則多行批次輸入

## Impact

- Affected specs: `lunch-ordering`（修改）
- Affected code:
  - `src/bot/commands.js`（`handleWizardInput` 新增 `confirming_menu` 分支、`adding_items` 分支改為預覽確認、`setting_threshold` 分支的提示文字）
  - `src/bot/handlers.js`（session state check 擴充 `confirming_menu`）
