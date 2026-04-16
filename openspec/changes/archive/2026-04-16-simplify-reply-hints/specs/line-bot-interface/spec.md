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
