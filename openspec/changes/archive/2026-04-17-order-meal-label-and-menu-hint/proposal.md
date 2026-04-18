## Why

群組成員收到菜單時，無法從菜單本身得知這份訂單是哪天、哪一餐的，容易造成混淆。同時菜單缺乏操作說明，新成員不清楚如何點餐。

## What Changes

- 新增 wizard 步驟（`setting_meal_label`）：主辦人建立訂單後，在設定外送標準之前，先詢問「餐點說明」（例如：`明天午餐`、`4/18 便當`），可輸入 `/略過` 跳過
- 新增 wizard 步驟（`setting_deadline`）：在 `setting_meal_label` 之後、`setting_threshold` 之前，詢問「點餐截止時間」（例如：`4月18號中午12點`），可輸入 `/略過` 跳過
- `orders` 資料表新增 `meal_label` 欄位（TEXT，可為 NULL）儲存餐點說明
- `orders` 資料表新增 `order_deadline` 欄位（TEXT，可為 NULL）儲存截止時間
- 菜單 Flex Message 的 header 標題改為：
  - 有 meal_label：`🍱 便當店｜明天午餐`
  - 無 meal_label：`🍱 便當店`
- 菜單 Flex Message 的 header 固定新增副標題文字：`請直接在下方點選點餐`（灰白小字）
- 菜單 Flex Message 的 header 新增第三行截止時間（有設定才顯示）：`⏰ 截止：4月18號中午12點`（灰白小字）

## Non-Goals

- 不支援自訂副標題文字（固定為「請直接在下方點選點餐」）
- 不對 meal_label 或 order_deadline 做格式驗證，接受任意自由文字
- 截止時間僅供顯示，系統不進行自動鎖單或提醒
- 不修改 `/發布菜單` 的流程，該指令直接讀取已存欄位渲染即可

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `lunch-ordering`：Create Order Session wizard 新增 `setting_meal_label` 與 `setting_deadline` 狀態，在 `setting_threshold` 之前依序執行
- `line-bot-interface`：菜單 Flex Message header 渲染邏輯更新（標題加 meal_label、固定副標題、截止時間第三行）

## Impact

- Affected specs: `lunch-ordering`、`line-bot-interface`
- Affected code:
  - `src/db/schema.js`（orders 表 migration：新增 meal_label、order_deadline 欄位）
  - `src/db/queries.js`（createOrder 接受 meal_label 參數；新增 updateOrderMealLabel、updateOrderDeadline；getActiveOrder 已包含新欄位）
  - `src/bot/commands.js`（createOrderSession 改為進入 setting_meal_label 狀態；handleWizardInput 新增 setting_meal_label、setting_deadline 狀態處理）
  - `src/bot/messages.js`（buildMenuFlexMessage 更新 header 渲染）
