## Why

`/取消訂單` 指令名稱與 `/取消餐點` 相似，語意不夠精確；付款流程改由同仁自行回報，避免主辦人需逐一手動標記，降低操作負擔；付款通知訊息改為 Flex Message 附內嵌按鈕，方便成員直接在群組中點選回報付款方式。

## What Changes

- 指令 `/取消訂單` 更名為 `/關閉訂單`（handlers.js 路由、權限檢查，commands.js 提示文字）
- 主辦人執行 `/確認下單` 後，bot 回覆加上：「請大家撥空付款，可現金、轉帳或 LINE Pay」
- 付款通知改為 Flex Message，內嵌現金／轉帳／LINE Pay 三顆按鈕；成員點選任一按鈕即自動標記為已付款
- 移除主辦人 `/已收款 <名字>` 指令（不再需要手動確認收款）
- 移除付款通知中的 Quick Reply 按鈕與「請選擇付款方式」文字（改為 Flex 內嵌按鈕）

## Non-Goals (optional)

- 不新增付款方式選項（僅現金、轉帳、LINE Pay）
- 不改動其他指令名稱
- 不更動 `/收款狀態` 功能（主辦人仍可查看付款進度）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `line-bot-interface`：指令名稱、付款通知訊息格式、付款流程（自助回報取代主辦手動標記）

## Impact

- Affected specs: `line-bot-interface`
- Affected code:
  - `src/bot/handlers.js`（路由比對、organizer 權限清單：移除 `/已收款`、`/取消訂單` 改 `/關閉訂單`）
  - `src/bot/commands.js`（hint 文字、`setPaymentMethod` 改為直接標記已付、移除 `markMemberPaid`）
  - `src/bot/messages.js`（`buildPaymentNotificationMessage` 改為 Flex Message）
  - `src/db/queries.js`（新增 `markPaidByUserId` 以 userId 標記已付）
