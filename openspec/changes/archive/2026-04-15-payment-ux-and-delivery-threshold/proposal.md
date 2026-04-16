## Why

付款確認訊息的版面在 LINE 上顯示不佳（金額被擠壓）、收款狀態只顯示已回報者而看不到未付同仁、且缺少外送標準資訊讓主辦人無法判斷是否達到免外送門檻。

## What Changes

- **付款確認 Flex Message 版面修正**：每位成員改為兩行顯示——第一行「姓名 ＋ 金額」各佔一半寬度，第二行顯示品項文字，確保金額不被擠壓
- **重複點選付款按鈕提示**：已選擇付款方式後再次點選，顯示「您已選擇付款方式，選擇後無法更改。」
- **收款狀態完整顯示**：以 `order_items` 為基準列出所有訂餐同仁（而非僅 `payments` 表內的人）；有付款記錄者顯示付款方式，無記錄者顯示「未選擇｜未付」；排除主辦人（method='organizer'）
- **外送標準功能**：新增訂單 wizard 新增「設定外送標準」步驟，主辦人可輸入門檻金額或 `/略過`；`orders` 表新增 `delivery_threshold` 欄位；`/統計` 顯示目前總金額，以及是否已達外送標準

## Non-Goals (optional)

- 不新增付款方式選項
- 外送費本身（超出門檻的費用金額）不在此 change 範圍內，僅記錄標準門檻
- 不變更訂單確認後的付款通知推送邏輯

## Capabilities

### New Capabilities

- `delivery-threshold`: 訂單建立時記錄外送標準金額，並在統計時顯示達標狀態

### Modified Capabilities

- `payment-tracking`: 付款確認訊息版面、重複點選保護、收款狀態完整顯示邏輯
- `lunch-ordering`: 新增訂單 wizard 新增外送標準設定步驟，`orders` 表新增欄位

## Impact

- Affected specs: `delivery-threshold`（新增）、`payment-tracking`（修改）、`lunch-ordering`（修改）
- Affected code:
  - `src/bot/messages.js`（付款確認 Flex Message 版面）
  - `src/bot/commands.js`（setPaymentMethod 重複點選訊息、viewPaymentStatus 查詢邏輯、createOrderSession / handleWizardInput 新增 setting_threshold 狀態）
  - `src/bot/handlers.js`（session state 新增 setting_threshold 分支）
  - `src/db/queries.js`（新增 setDeliveryThreshold 函式）
  - `src/db/schema.js`（orders 表新增 delivery_threshold 欄位，加 ALTER TABLE 相容遷移）
