# payment-tracking Specification

## Purpose

TBD - created by archiving change 'office-lunch-bot'. Update Purpose after archive.

## Requirements

### Requirement: Send Payment Notifications

When an order is confirmed, the system SHALL send a payment notification as a Flex Message to the LINE group. The Flex Message SHALL list each member (excluding the organizer) in a vertical layout: the first row SHALL show the member's name and amount side-by-side (each occupying 50% width), and the second row SHALL show the member's ordered items in a smaller, wrapped font. A grand total SHALL appear below a separator. The footer SHALL contain an instruction text followed by inline postback buttons for the three payment methods.

**Footer instruction text:** The footer SHALL begin with the text `請同仁付完款後，直接點選以下的付款方式` rendered as a text element above the three payment method buttons. The text element SHALL appear before any button elements in the footer `contents` array.

#### Scenario: Payment notification includes instruction text above buttons

- **WHEN** the order status transitions to `confirmed` and the system sends the payment notification Flex Message
- **THEN** the Flex Message footer SHALL contain a text element with `請同仁付完款後，直接點選以下的付款方式` as the first element in the footer `contents` array
- **THEN** the three payment method buttons (現金, 轉帳, LINE Pay) SHALL appear after the instruction text element

#### Scenario: Payment notification sent after order confirmation

- **WHEN** the order status transitions to `confirmed`
- **THEN** the system SHALL send a Flex Message to the group with one vertical entry per non-organizer member showing their name, amount, and ordered items, followed by a grand total, and three payment method postback buttons in the footer


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
### Requirement: Record Payment Method

The system SHALL allow each member to select their payment method exactly once by tapping a postback button in the payment notification Flex Message. The selection SHALL be stored in the Payment record (`paid = 1`) for that member and order. If a member taps a payment method button a second time, the system SHALL reply with "您已選擇付款方式，選擇後無法更改。" and SHALL NOT modify the existing payment record.

#### Scenario: Member selects payment method

- **WHEN** a group member taps a payment method button (現金, 轉帳, or LINE Pay) in the payment notification Flex Message and has no existing payment record with `paid = 1`
- **THEN** the system SHALL save the payment method with `paid = 1` for that member and reply with a confirmation message

#### Scenario: Duplicate tap rejected

- **WHEN** a member taps any payment method button and their payment record already has `paid = 1`
- **THEN** the system SHALL reply with "您已選擇付款方式，選擇後無法更改。" and SHALL NOT alter the existing payment record


<!-- @trace
source: payment-ux-and-delivery-threshold
updated: 2026-04-15
code:
  - src/db/schema.js
  - .obsidian/workspace.json
  - src/bot/commands.js
  - src/db/queries.js
  - src/bot/handlers.js
  - src/bot/messages.js
  - .DS_Store
-->

---
### Requirement: View Payment Status

The system SHALL allow the organizer to view the complete payment status by sending `/收款狀態`. The reply SHALL list every member who placed an order (derived from `order_items`), excluding the organizer. Members with a payment record (`paid = 1`) SHALL show their payment method label. Members with no payment record or `paid = 0` SHALL show "未選擇｜未付". The denominator for the paid/total count SHALL be the number of non-organizer members who placed an order.

#### Scenario: Organizer views payment status with mixed results

- **WHEN** organizer sends `/收款狀態` on a confirmed order that has both paid and unpaid members
- **THEN** the system SHALL reply listing every non-organizer member: paid members with their payment method, unpaid members with "未選擇｜未付", and a summary count (e.g., "已付款 2/4 人")

#### Scenario: Organizer views payment status on open order

- **WHEN** organizer sends `/收款狀態` while order status is `open`
- **THEN** the system SHALL reply indicating the order has not been confirmed yet

<!-- @trace
source: payment-ux-and-delivery-threshold
updated: 2026-04-15
code:
  - src/db/schema.js
  - .obsidian/workspace.json
  - src/bot/commands.js
  - src/db/queries.js
  - src/bot/handlers.js
  - src/bot/messages.js
  - .DS_Store
-->