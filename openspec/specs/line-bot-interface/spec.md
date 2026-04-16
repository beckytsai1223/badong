# line-bot-interface Specification

## Purpose

TBD - created by archiving change 'office-lunch-bot'. Update Purpose after archive.

## Requirements

### Requirement: Webhook Signature Verification

The system SHALL verify the `X-Line-Signature` header on every incoming webhook request using the channel secret. Requests with an invalid or missing signature SHALL be rejected with HTTP 400 and SHALL NOT be processed.

#### Scenario: Valid webhook request is processed

- **WHEN** a webhook POST request arrives with a valid `X-Line-Signature` header
- **THEN** the system SHALL process the event payload normally

#### Scenario: Invalid signature is rejected

- **WHEN** a webhook POST request arrives with an invalid or missing `X-Line-Signature` header
- **THEN** the system SHALL respond with HTTP 400 and SHALL NOT process the event

---
### Requirement: Organizer Command Routing

The system SHALL recognize the following text commands sent by any user in the group and route them to the appropriate handler. Commands SHALL be matched by prefix (case-insensitive for the command keyword):

| Command | Handler |
|---|---|
| `/新增訂單 <restaurant>` | Create order session |
| `/統計` | View order tally |
| `/確認下單` | Confirm order |
| `/收款狀態` | View payment status |
| `/關閉訂單` | Cancel/close the active order |
| `/取消餐點` | Cancel own items (or named user's items if organizer) |

Unrecognized messages during an active wizard session (menu item entry) SHALL be forwarded to the wizard handler. All other unrecognized messages SHALL be silently ignored.

#### Scenario: Recognized command is routed

- **WHEN** a user sends `/統計` in the group
- **THEN** the system SHALL invoke the view-tally handler and reply with the tally

#### Scenario: /關閉訂單 is routed to cancel handler

- **WHEN** an organizer sends `/關閉訂單`
- **THEN** the system SHALL invoke the cancel-order handler and close the active order

#### Scenario: /取消訂單 is no longer recognized

- **WHEN** any user sends `/取消訂單`
- **THEN** the system SHALL silently ignore it (no reply, no action)

#### Scenario: /已收款 is no longer recognized

- **WHEN** any user sends `/已收款 <name>`
- **THEN** the system SHALL silently ignore it (no reply, no action)

#### Scenario: Unrecognized message during wizard is forwarded

- **WHEN** a user sends a plain text message while an item-entry wizard session is active for that user
- **THEN** the system SHALL forward the message to the wizard handler

#### Scenario: Unrecognized message outside wizard is ignored

- **WHEN** a user sends a plain text message that does not match any command and no wizard is active
- **THEN** the system SHALL not reply


<!-- @trace
source: close-order-ux
updated: 2026-04-15
code:
  - src/db/queries.js
  - src/bot/messages.js
  - src/bot/commands.js
  - .obsidian/workspace.json
  - src/bot/handlers.js
  - .DS_Store
-->

---
### Requirement: Flex Message Menu Rendering

The system SHALL render the active order's menu as a LINE Flex Message containing the restaurant name as the header and one Quick Reply button per menu item. Each Quick Reply button SHALL display the item name and price, and SHALL carry a postback payload in the format `action=select_item&order_id=<id>&item_id=<id>`.

#### Scenario: Flex Message is sent after menu entry completes

- **WHEN** the organizer ends the menu-entry dialog
- **THEN** the system SHALL send a Flex Message to the group with the restaurant name and one Quick Reply button per menu item (showing name and price)

#### Scenario: Flex Message Quick Reply carries correct postback

- **WHEN** a Quick Reply button in the menu Flex Message is tapped
- **THEN** the postback data SHALL be in the format `action=select_item&order_id=<id>&item_id=<id>` with the correct IDs

---
### Requirement: Postback Event Handling

The system SHALL handle LINE postback events triggered by Quick Reply button taps. The system SHALL parse the `data` field as a query string and dispatch to the correct handler based on the `action` parameter. Supported actions: `select_item`, `set_payment`. Unknown actions SHALL be silently ignored.

#### Scenario: select_item postback is dispatched

- **WHEN** a postback event arrives with `action=select_item`
- **THEN** the system SHALL invoke the select-item handler with the parsed `order_id` and `item_id`

#### Scenario: set_payment postback is dispatched

- **WHEN** a postback event arrives with `action=set_payment`
- **THEN** the system SHALL invoke the set-payment-method handler with the parsed `order_id` and `method`

#### Scenario: Unknown action is ignored

- **WHEN** a postback event arrives with an unrecognized `action` value
- **THEN** the system SHALL not reply and SHALL not throw an error

---
### Requirement: Role-Aware Command Hints

The system SHALL append a context-sensitive hint block to command replies, with the following explicit exceptions where the hint is MODIFIED or REMOVED entirely:

**Item selection reply (`select_item` postback):**
The reply SHALL append exactly one line: `/取消餐點 → 取消自己的選餐重選`. The line SHALL appear for both organizers and non-organizers. The reply SHALL NOT include any other hint content (e.g., `/統計`, `/確認下單`, `/關閉訂單`, menu button reminder).

**Tally reply (`/統計`):**
The reply SHALL NOT include any hint block.

**Payment status reply (`/收款狀態`):**
The reply SHALL NOT include any hint block.

**Payment method selection reply (`set_payment` postback):**
The reply SHALL NOT include any hint block.

All other command replies (e.g., `/取消餐點`, `/關閉訂單`, wizard prompts) SHALL continue to follow the existing role-aware hint behavior.

#### Scenario: Any user receives single-line hint after selecting item

- **WHEN** any user (organizer or non-organizer) taps a menu item button on an `open` order
- **THEN** the reply SHALL contain `/取消餐點 → 取消自己的選餐重選`
- **THEN** the reply SHALL NOT contain `/統計`, `/確認下單`, `/關閉訂單`, `/收款狀態`, or any "點選菜單按鈕" reminder

#### Scenario: Tally reply has no hint block

- **WHEN** any user sends `/統計`
- **THEN** the reply SHALL contain only the tally content (member orders, totals, delivery threshold status)
- **THEN** the reply SHALL NOT contain any `📌 可用指令` section

#### Scenario: Payment status reply has no hint block

- **WHEN** the organizer sends `/收款狀態`
- **THEN** the reply SHALL contain only the payment status list and count
- **THEN** the reply SHALL NOT contain any `📌 可用指令` section

#### Scenario: Payment method selection reply has no hint block

- **WHEN** any user taps a payment method button
- **THEN** the reply SHALL confirm the recorded payment method
- **THEN** the reply SHALL NOT contain any `📌 可用指令` section


<!-- @trace
source: simplify-reply-hints
updated: 2026-04-16
code:
  - .obsidian/workspace.json
  - src/bot/handlers.js
  - src/bot/commands.js
  - src/bot/messages.js
  - src/db/queries.js
  - src/db/schema.js
  - .DS_Store
-->

---
### Requirement: Payment Notification Text

The payment notification message pushed to the group after order confirmation SHALL list each participant's ordered items and subtotal, and the grand total. The message SHALL be a Flex Message containing three inline payment method buttons: 現金, 轉帳, LINE Pay. Each button SHALL trigger a postback with format `action=set_payment&order_id=<id>&method=<method>`. The message SHALL NOT include Quick Reply buttons. The message SHALL NOT include the text "請選擇付款方式".

#### Scenario: Payment notification is Flex Message with inline buttons

- **WHEN** the organizer confirms an order and the system pushes the payment notification to the group
- **THEN** the notification SHALL be a Flex Message showing each user's items, subtotal per user, and grand total
- **THEN** the notification SHALL contain three buttons: 現金, 轉帳, LINE Pay
- **THEN** the notification text SHALL NOT contain "請選擇付款方式"
- **THEN** the notification SHALL NOT carry Quick Reply buttons


<!-- @trace
source: close-order-ux
updated: 2026-04-15
code:
  - src/db/queries.js
  - src/bot/messages.js
  - src/bot/commands.js
  - .obsidian/workspace.json
  - src/bot/handlers.js
  - .DS_Store
-->

---
### Requirement: Self-Report Payment

When a member taps a payment method button in the payment notification, the system SHALL record their payment method and SHALL immediately mark them as paid. The system SHALL NOT require organizer confirmation to mark a payment as received.

#### Scenario: Member self-reports payment and is marked paid

- **WHEN** a member taps a payment method button (現金, 轉帳, or LINE Pay) in the group's payment notification
- **THEN** the system SHALL record the payment method
- **THEN** the system SHALL immediately mark that member's payment as paid (`paid = 1`)
- **THEN** the system SHALL reply with a confirmation message

#### Scenario: Order Confirmation Payment Reminder

- **WHEN** the organizer sends `/確認下單` and the order is successfully confirmed
- **THEN** the system's reply to the organizer SHALL include the text "請大家撥空付款，可現金、轉帳或 LINE Pay"


<!-- @trace
source: close-order-ux
updated: 2026-04-15
code:
  - src/db/queries.js
  - src/bot/messages.js
  - src/bot/commands.js
  - .obsidian/workspace.json
  - src/bot/handlers.js
  - .DS_Store
-->

---
### Requirement: Help Command

The system SHALL handle the `/help` text command sent by any user. The reply SHALL be role-aware:

- **Organizer**: full command list including organizer-exclusive commands, grouped by function
- **Non-organizer**: commands accessible to members only

The help reply SHALL include every currently valid command and its one-line description. Organizer-exclusive commands SHALL be labeled with `（主辦人）`. The `/help` command SHALL be listed at the end of the help reply.

The complete organizer help text SHALL be:

```
📋 可用指令

【訂餐管理】
/新增訂單 <店名> → 開始新一輪訂餐（主辦人）
/統計 → 查看目前選餐（主辦人）
/確認下單 → 結單並發送付款通知（主辦人）
/關閉訂單 → 取消整筆訂單（主辦人）

【點餐】
點選菜單按鈕 → 點餐（可多選）
/取消餐點 → 取消自己的選餐重選
/取消餐點 <名字> → 取消他人選餐（主辦人）

【付款】
點選付款通知按鈕 → 回報付款方式（現金／轉帳／LINE Pay）
/收款狀態 → 查看付款進度（主辦人）

【其他】
/我的ID → 查看自己的 LINE ID
/help → 顯示本說明
```

The complete non-organizer help text SHALL be:

```
📋 可用指令

【點餐】
點選菜單按鈕 → 點餐（可多選）
/取消餐點 → 取消自己的選餐重選

【付款】
點選付款通知按鈕 → 回報付款方式（現金／轉帳／LINE Pay）

【其他】
/我的ID → 查看自己的 LINE ID
/help → 顯示本說明
```

#### Scenario: Organizer receives full help text

- **WHEN** an organizer sends `/help`
- **THEN** the system SHALL reply with the organizer help text containing all commands including organizer-exclusive ones labeled `（主辦人）`

#### Scenario: Non-organizer receives member help text

- **WHEN** a non-organizer sends `/help`
- **THEN** the system SHALL reply with the member help text and SHALL NOT include organizer-exclusive commands


<!-- @trace
source: close-order-ux
updated: 2026-04-15
code:
  - src/db/queries.js
  - src/bot/messages.js
  - src/bot/commands.js
  - .obsidian/workspace.json
  - src/bot/handlers.js
  - .DS_Store
-->

---
### Requirement: Organizer Auto-Payment

When the organizer confirms the order, the system SHALL automatically mark the organizer as paid with method `organizer`. The organizer SHALL NOT need to tap any payment button. If the organizer has order items, their payment record SHALL be pre-created with `paid = 1` at the time of order confirmation.

#### Scenario: Organizer is auto-marked paid on confirm

- **WHEN** the organizer sends `/確認下單` and the order is successfully confirmed
- **THEN** the system SHALL call `upsertPayment(order.id, organizerUserId, organizerDisplayName, 'organizer')` followed by `markPaidByUserId(order.id, organizerUserId)`
- **THEN** the organizer SHALL appear as paid in `/收款狀態` without having tapped any payment button

<!-- @trace
source: close-order-ux
updated: 2026-04-15
code:
  - src/db/queries.js
  - src/bot/messages.js
  - src/bot/commands.js
  - .obsidian/workspace.json
  - src/bot/handlers.js
  - .DS_Store
-->