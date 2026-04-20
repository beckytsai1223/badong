## MODIFIED Requirements

### Requirement: Role-Aware Command Hints

The system SHALL append a context-sensitive hint block to command replies, with the following explicit exceptions where the hint is MODIFIED or REMOVED entirely:

**Item selection reply (`select_item` postback):**
The reply SHALL append exactly one line: `/取消餐點 → 取消自己的選餐重選`. The line SHALL appear for both organizers and non-organizers. The reply SHALL NOT include any other hint content (e.g., `/統計`, `/確認下單`, `/關閉訂單`, menu button reminder).

**Tally reply (`/統計`):**
The reply SHALL NOT include any hint block.

**Payment status reply (`/收款狀態`):**
The reply SHALL NOT include any hint block.

**Payment method selection reply (`set_payment` postback):**
The reply SHALL NOT include any hint block and SHALL NOT send any confirmation message to the member who tapped the button. The payment SHALL be recorded silently.

**Cancel meal reply (`/取消餐點`):**
The reply SHALL NOT include any hint block, for both the self-cancel and organizer-cancel-named-user variants.

All other command replies (e.g., `/關閉訂單`, wizard prompts) SHALL continue to follow the existing role-aware hint behavior.

#### Scenario: Any user receives single-line hint after selecting item

- **WHEN** any user (organizer or non-organizer) taps a menu item button on an `open` order
- **THEN** the reply SHALL contain `/取消餐點 → 取消自己的選餐重選`
- **THEN** the reply SHALL NOT contain `/統計`, `/確認下單`, `/關閉訂單`, `/收款狀態`, or any "點選菜單按鈕" reminder

#### Scenario: Tally reply has no hint block

- **WHEN** any user sends `/統計`
- **THEN** the reply SHALL contain only the tally content (member orders, totals, item count summary, delivery threshold status)
- **THEN** the reply SHALL NOT contain any `📌 可用指令` section

#### Scenario: Payment status reply has no hint block

- **WHEN** the organizer sends `/收款狀態`
- **THEN** the reply SHALL contain only the payment status list and count
- **THEN** the reply SHALL NOT contain any `📌 可用指令` section

#### Scenario: Payment method selection produces no reply

- **WHEN** any user taps a payment method button for the first time
- **THEN** the system SHALL record the payment silently and SHALL NOT send any reply message to the group or the user

#### Scenario: Self-cancel reply has no hint block

- **WHEN** any user sends `/取消餐點` and has existing items in an open order
- **THEN** the reply SHALL confirm cancellation with the user's display name (e.g., "✅ 已取消 {displayName} 的餐點選擇，可重新點選。")
- **THEN** the reply SHALL NOT contain any `📌 可用指令` section

#### Scenario: Organizer cancel named user reply has no hint block

- **WHEN** the organizer sends `/取消餐點 <name>` and the named user has existing items
- **THEN** the reply SHALL confirm cancellation (e.g., "✅ 已取消「<name>」的餐點選擇。")
- **THEN** the reply SHALL NOT contain any `📌 可用指令` section

---

### Requirement: Self-Report Payment

When a member taps a payment method button in the payment notification, the system SHALL record their payment method and SHALL immediately mark them as paid. The system SHALL NOT require organizer confirmation to mark a payment as received. The system SHALL NOT send any reply message to the member after a successful first-time payment selection. If a member attempts to tap a payment method button a second time, the system SHALL reply with "您已選擇付款方式，選擇後無法更改。" and SHALL NOT modify the existing payment record.

#### Scenario: Member self-reports payment silently

- **WHEN** a member taps a payment method button (現金, 轉帳, or LINE Pay) in the group's payment notification for the first time
- **THEN** the system SHALL record the payment method
- **THEN** the system SHALL immediately mark that member's payment as paid (`paid = 1`)
- **THEN** the system SHALL NOT send any reply or confirmation message

#### Scenario: Duplicate tap is rejected with a reply

- **WHEN** a member taps any payment method button and their payment record already has `paid = 1`
- **THEN** the system SHALL reply with "您已選擇付款方式，選擇後無法更改。"
- **THEN** the system SHALL NOT alter the existing payment record

#### Scenario: Order Confirmation Payment Reminder

- **WHEN** the organizer sends `/確認下單` and the order is successfully confirmed
- **THEN** the system's reply to the organizer SHALL include the text "請大家撥空付款，可現金、轉帳或 LINE Pay"

---

## ADDED Requirements

### Requirement: Tally Item Count Summary

The `/統計` reply SHALL include an item count summary block after the grand total line. The summary SHALL list each distinct menu item name and the number of portions ordered, in the format `{item_name}：N 份`, one item per line. Items with zero orders SHALL NOT appear.

#### Scenario: Item count summary appears after grand total

- **WHEN** any user sends `/統計` and at least one order item exists
- **THEN** the reply SHALL contain a section after the grand total line listing each distinct item and its order count in the format `{item_name}：N 份`

#### Scenario: Items with no orders are excluded from summary

- **WHEN** the tally is generated and some menu items have no orders placed
- **THEN** those items SHALL NOT appear in the item count summary

#### Scenario: Cancel meal reply uses display name

- **WHEN** any user sends `/取消餐點` and the cancellation succeeds
- **THEN** the reply text SHALL use the user's LINE display name (e.g., "✅ 已取消 小明 的餐點選擇，可重新點選。")
- **THEN** the reply SHALL NOT use the generic text "你的"
