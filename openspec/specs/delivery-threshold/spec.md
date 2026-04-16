# delivery-threshold Specification

## Purpose

TBD - created by archiving change 'payment-ux-and-delivery-threshold'. Update Purpose after archive.

## Requirements

### Requirement: Set Delivery Threshold

When creating a new order, the system SHALL prompt the organizer to optionally set a delivery threshold amount. The threshold SHALL be stored as an integer in the `orders` table under the `delivery_threshold` column. If the organizer skips this step, the value SHALL remain NULL.

#### Scenario: Organizer sets delivery threshold

- **WHEN** the organizer is prompted for the delivery threshold during order creation and enters a positive integer (e.g., `500`)
- **THEN** the system SHALL save the value to `orders.delivery_threshold` for the current order, transition the wizard to the `adding_items` state, and reply confirming the threshold (e.g., "外送標準設為 $500，請輸入菜單...")

#### Scenario: Organizer skips delivery threshold

- **WHEN** the organizer is prompted for the delivery threshold and sends `/略過` or an empty message
- **THEN** the system SHALL leave `delivery_threshold` as NULL, transition to `adding_items`, and proceed with the normal menu-item dialog

#### Scenario: Organizer enters invalid threshold input

- **WHEN** the organizer is prompted for the delivery threshold and enters a non-numeric string (other than `/略過`)
- **THEN** the system SHALL reply with a format hint and keep the wizard in the `setting_threshold` state


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
### Requirement: Display Delivery Threshold Status in Tally

When the organizer views `/統計`, if the order has a `delivery_threshold`, the system SHALL display whether the current grand total meets or falls short of the threshold.

#### Scenario: Grand total meets delivery threshold

- **WHEN** organizer sends `/統計` and `order.delivery_threshold` is not NULL and `grandTotal >= delivery_threshold`
- **THEN** the system SHALL append "✅ 已達外送標準（$N）" to the tally reply, where N is the threshold value

#### Scenario: Grand total falls short of delivery threshold

- **WHEN** organizer sends `/統計` and `order.delivery_threshold` is not NULL and `grandTotal < delivery_threshold`
- **THEN** the system SHALL append "⚠️ 距外送標準還差 $M（標準：$N）" to the tally reply, where M is the shortfall and N is the threshold value

#### Scenario: No delivery threshold set

- **WHEN** organizer sends `/統計` and `order.delivery_threshold` is NULL
- **THEN** the system SHALL NOT display any delivery threshold information

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