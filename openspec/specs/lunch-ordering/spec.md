# lunch-ordering Specification

## Purpose

TBD - created by archiving change 'office-lunch-bot'. Update Purpose after archive.

## Requirements

### Requirement: Create Order Session

The system SHALL allow the organizer to create a new ordering session by providing a restaurant name via the `/新增訂單 <restaurant>` command. After saving the new order, the system SHALL enter a `setting_threshold` wizard state and prompt the organizer to optionally enter a delivery threshold amount. After the threshold step (whether set or skipped), the wizard SHALL transition to the `adding_items` state and prompt the organizer to submit all menu items in a single multi-line message. Each line in the message SHALL represent one menu item in the format `品名 金額`. If all lines are valid, the system SHALL display the parsed items back to the organizer for confirmation and transition to the `confirming_menu` state. If any line is malformed, the system SHALL reject the entire batch, list the malformed lines in the reply, and remain in `adding_items` for the organizer to retry. In the `confirming_menu` state, if the organizer sends `/確認`, the system SHALL save all pending items and send the menu Flex Message to the group, ending the wizard. If the organizer sends any other multi-line message, the system SHALL re-parse it as a new batch, replace the pending items, and display the new preview for confirmation. Only one active order (status `open`) SHALL exist at a time; attempting to create a new one while another is active SHALL be rejected with an error message.

#### Scenario: Organizer creates a new order

- **WHEN** organizer sends `/新增訂單 老媽便當` in the group
- **THEN** the system SHALL save a new order with restaurant_name "老媽便當" and status `open`, set the session state to `setting_threshold`, and prompt the organizer to enter a delivery threshold amount or `/略過`

#### Scenario: Organizer submits all menu items in one message

- **WHEN** organizer sends a multi-line message during the `adding_items` state where every line matches the format `品名 金額` (e.g., `排骨飯 80\n雞腿飯 90\n素食 75`)
- **THEN** the system SHALL display the parsed item list back to the organizer (each item on one line as `品名 $金額`), ask for confirmation, and transition to the `confirming_menu` state with the pending items stored in session data

#### Scenario: Batch rejected when any line is malformed

- **WHEN** organizer sends a multi-line message during the `adding_items` state and at least one line does not match the `品名 金額` format
- **THEN** the system SHALL NOT save any items, SHALL reply listing each malformed line and its line number, and SHALL remain in the `adding_items` state for the organizer to retry

#### Scenario: Organizer confirms menu

- **WHEN** organizer sends `/確認` during the `confirming_menu` state
- **THEN** the system SHALL save all pending items from session data, clear the session, and send the menu Flex Message to the group

#### Scenario: Organizer re-enters menu during confirmation

- **WHEN** organizer sends a new multi-line message during the `confirming_menu` state where every line matches the format `品名 金額`
- **THEN** the system SHALL replace the pending items with the newly parsed items, display the new item list for confirmation, and remain in the `confirming_menu` state

#### Scenario: Re-entry rejected when any line is malformed during confirmation

- **WHEN** organizer sends a multi-line message during the `confirming_menu` state and at least one line does not match the `品名 金額` format
- **THEN** the system SHALL NOT update the pending items, SHALL reply listing each malformed line and its line number, and SHALL remain in the `confirming_menu` state

#### Scenario: Create order rejected when another is active

- **WHEN** organizer sends `/新增訂單` while an order with status `open` or `confirmed` exists
- **THEN** the system SHALL reply with an error message indicating an active order already exists


<!-- @trace
source: menu-bulk-input
updated: 2026-04-15
code:
  - .obsidian/workspace.json
  - src/db/queries.js
  - src/bot/handlers.js
  - src/db/schema.js
  - .DS_Store
  - src/bot/messages.js
  - src/bot/commands.js
-->

---
### Requirement: Select Menu Item

The system SHALL allow group members to select one or more menu items from the active order by tapping buttons in the menu Flex Message. Each tap SHALL record a new OrderItem linked to the member's LINE userId and display name. Multiple taps by the same member SHALL accumulate (not replace) their selections. Selection SHALL only be accepted when order status is `open`.

After recording a selection, the system SHALL push a new copy of the menu Flex Message to the group, so that the menu remains visible at the bottom of the chat for members who joined later.

#### Scenario: Member selects a menu item

- **WHEN** a group member taps a menu item button on an `open` order
- **THEN** the system SHALL record a new OrderItem for that member and reply with a confirmation showing the selected item, all of the member's current selections, and their running total

#### Scenario: Menu is re-pushed after selection

- **WHEN** a group member successfully selects a menu item
- **THEN** the system SHALL push a new menu Flex Message to the group immediately after the reply

#### Scenario: Selection rejected on confirmed order

- **WHEN** a group member taps a menu item button on an order with status `confirmed` or `closed`
- **THEN** the system SHALL reply with a message that the order is already confirmed and no changes are accepted


<!-- @trace
source: resend-menu-and-role-hints
updated: 2026-04-13
code:
  - .DS_Store
  - src/bot/handlers.js
  - src/bot/commands.js
  - .obsidian/workspace.json
  - src/bot/auth.js
-->

---
### Requirement: View Order Tally

The system SHALL allow the organizer to view a summary of all current selections by sending `/統計`. The summary SHALL list each member's name, selected item, and price, plus a grand total item count and total amount. If the order has a `delivery_threshold`, the system SHALL additionally display whether the grand total meets or falls short of the threshold.

#### Scenario: Organizer views tally with selections

- **WHEN** organizer sends `/統計` and at least one member has selected an item
- **THEN** the system SHALL reply with a message listing each member's selection and price, the total amount, and (if `delivery_threshold` is set) the threshold status

#### Scenario: Organizer views tally with no selections

- **WHEN** organizer sends `/統計` and no member has selected yet
- **THEN** the system SHALL reply indicating no selections have been made


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
### Requirement: Confirm Order

The system SHALL allow the organizer to lock the active order by sending `/確認下單`. The order status SHALL change from `open` to `confirmed`. Once confirmed, no further item selections SHALL be accepted. The system SHALL trigger the payment notification flow upon confirmation.

#### Scenario: Organizer confirms an order with selections

- **WHEN** organizer sends `/確認下單` on an `open` order that has at least one selection
- **THEN** the system SHALL update the order status to `confirmed` and proceed to send payment notifications to all members who selected items

#### Scenario: Confirm rejected on empty order

- **WHEN** organizer sends `/確認下單` on an `open` order with no selections
- **THEN** the system SHALL reply with an error message indicating no items have been selected