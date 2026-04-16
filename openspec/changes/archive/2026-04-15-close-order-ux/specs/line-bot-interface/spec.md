## MODIFIED Requirements

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

---

### Requirement: Role-Aware Command Hints

Most command replies SHALL append a context-sensitive list of available next-step commands to the reply text. Exceptions: the order creation confirmation (`/新增訂單`) and the order confirm reply (`/確認下單`) SHALL NOT include a hint block. The hint list SHALL differ based on whether the replying user is an organizer:

- **Organizer**: hint shows organizer-exclusive commands without any "(主辦人)" label suffix (e.g., `/統計`, `/確認下單`, `/關閉訂單`, `/收款狀態`)
- **Non-organizer**: hint shows only commands accessible to all members (e.g., menu selection buttons, `/取消餐點` for own items) and SHALL NOT include organizer-exclusive commands

Hint content SHALL be contextually appropriate for the current order status:
- `open` order: show ordering-related commands
- `confirmed` order: show payment-related commands (organizer: `/收款狀態`, `/關閉訂單`; non-organizer: payment button reminder)
- No active order: show `/新增訂單` (organizer only)
- Wizard mode: show item-entry instructions

#### Scenario: Organizer sees full command list after selecting item

- **WHEN** an organizer taps a menu item button on an `open` order
- **THEN** the reply SHALL include hints for `/統計`, `/確認下單`, `/取消餐點 <名字>`, and `/關閉訂單` without any "(主辦人)" label
- **THEN** the reply SHALL NOT include `/已收款`

#### Scenario: Non-organizer sees limited command list after selecting item

- **WHEN** a non-organizer taps a menu item button on an `open` order
- **THEN** the reply SHALL include only "點選菜單按鈕" and `/取消餐點`, and SHALL NOT include `/統計`, `/確認下單`, or `/關閉訂單`

#### Scenario: Organizer sees payment status hint after order confirmed

- **WHEN** an organizer selects a payment method via the payment notification button
- **THEN** the reply hint SHALL include `/收款狀態` and `/關閉訂單`, and SHALL NOT include `/已收款`

#### Scenario: Non-organizer sees payment recorded confirmation

- **WHEN** a non-organizer selects a payment method via the payment notification button
- **THEN** the reply SHALL confirm the recorded payment method and SHALL NOT include organizer commands

## ADDED Requirements

### Requirement: Payment Notification Text

The payment notification message pushed to the group after order confirmation SHALL list each participant's ordered items and subtotal, and the grand total. The message SHALL be a Flex Message containing three inline payment method buttons: 現金, 轉帳, LINE Pay. Each button SHALL trigger a postback with format `action=set_payment&order_id=<id>&method=<method>`. The message SHALL NOT include Quick Reply buttons. The message SHALL NOT include the text "請選擇付款方式".

#### Scenario: Payment notification is Flex Message with inline buttons

- **WHEN** the organizer confirms an order and the system pushes the payment notification to the group
- **THEN** the notification SHALL be a Flex Message showing each user's items, subtotal per user, and grand total
- **THEN** the notification SHALL contain three buttons: 現金, 轉帳, LINE Pay
- **THEN** the notification text SHALL NOT contain "請選擇付款方式"
- **THEN** the notification SHALL NOT carry Quick Reply buttons

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

### Requirement: Organizer Auto-Payment

When the organizer confirms the order, the system SHALL automatically mark the organizer as paid with method `organizer`. The organizer SHALL NOT need to tap any payment button. If the organizer has order items, their payment record SHALL be pre-created with `paid = 1` at the time of order confirmation.

#### Scenario: Organizer is auto-marked paid on confirm

- **WHEN** the organizer sends `/確認下單` and the order is successfully confirmed
- **THEN** the system SHALL call `upsertPayment(order.id, organizerUserId, organizerDisplayName, 'organizer')` followed by `markPaidByUserId(order.id, organizerUserId)`
- **THEN** the organizer SHALL appear as paid in `/收款狀態` without having tapped any payment button
