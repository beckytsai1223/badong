## ADDED Requirements

### Requirement: Role-Aware Command Hints

Most command replies SHALL append a context-sensitive list of available next-step commands to the reply text. Exceptions: the order creation confirmation (`/新增訂單`) and the order confirm reply (`/確認下單`) SHALL NOT include a hint block — the former provides inline instructions sufficient for the wizard flow; the latter is immediately followed by a pushed payment notification. The hint list SHALL differ based on whether the replying user is an organizer:

- **Organizer**: hint shows organizer-exclusive commands without any "(主辦人)" label suffix (e.g., `/統計`, `/確認下單`, `/取消訂單`, `/已收款 <名字>`, `/收款狀態`)
- **Non-organizer**: hint shows only commands accessible to all members (e.g., menu selection buttons, `/取消餐點` for own items, payment method buttons) and SHALL NOT include organizer-exclusive commands

Hint content SHALL be contextually appropriate for the current order status:
- `open` order: show ordering-related commands
- `confirmed` order: show payment-related commands
- No active order: show `/新增訂單` (organizer only)
- Wizard mode: show item-entry instructions

#### Scenario: Organizer sees full command list after selecting item

- **WHEN** an organizer taps a menu item button on an `open` order
- **THEN** the reply SHALL include hints for `/統計`, `/確認下單`, `/取消餐點 <名字>`, and `/取消訂單` without any "(主辦人)" label

#### Scenario: Non-organizer sees limited command list after selecting item

- **WHEN** a non-organizer taps a menu item button on an `open` order
- **THEN** the reply SHALL include only "點選菜單按鈕" and `/取消餐點`, and SHALL NOT include `/統計`, `/確認下單`, or `/取消訂單`

#### Scenario: Non-organizer sees only payment hint after setting payment method

- **WHEN** a non-organizer selects a payment method via Quick Reply postback
- **THEN** the reply hint SHALL reference the payment method buttons only, and SHALL NOT include `/收款狀態` or `/已收款 <名字>`
