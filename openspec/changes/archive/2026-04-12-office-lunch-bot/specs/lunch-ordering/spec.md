## ADDED Requirements

### Requirement: Create Order Session

The system SHALL allow the organizer to create a new ordering session by providing a restaurant name via the `/新增訂單 <restaurant>` command. The system SHALL enter a multi-turn dialog to collect menu items one by one. Each menu item SHALL have a name and price. The dialog SHALL end when the organizer sends an empty message or a designated end command. Only one active order (status `open`) SHALL exist at a time; attempting to create a new one while another is active SHALL be rejected with an error message.

#### Scenario: Organizer creates a new order

- **WHEN** organizer sends `/新增訂單 老媽便當` in the group
- **THEN** the system SHALL save a new order with restaurant_name "老媽便當" and status `open`, and prompt the organizer to enter menu items

#### Scenario: Organizer adds menu items via multi-turn dialog

- **WHEN** organizer sends a menu item in the format `排骨飯 80` (name space price) during the item-entry dialog
- **THEN** the system SHALL save the menu item and confirm the addition, then prompt for the next item

#### Scenario: Organizer ends menu entry

- **WHEN** organizer sends an empty message or `/完成` during the item-entry dialog
- **THEN** the system SHALL end the dialog, send a Flex Message to the group displaying the full menu with Quick Reply selection buttons

#### Scenario: Create order rejected when another is active

- **WHEN** organizer sends `/新增訂單` while an order with status `open` or `confirmed` exists
- **THEN** the system SHALL reply with an error message indicating an active order already exists

### Requirement: Select Menu Item

The system SHALL allow group members to select a menu item from the active order by tapping a Quick Reply button. Each member's selection SHALL be recorded as an OrderItem linked to their LINE userId and display name. A member who selects again SHALL have their previous selection replaced (last selection wins). Selection SHALL only be accepted when order status is `open`.

#### Scenario: Member selects a menu item

- **WHEN** a group member taps a Quick Reply button for a menu item on an `open` order
- **THEN** the system SHALL record the member's selection (userId, display name, menu item id) and reply with a confirmation message showing the selected item and price

#### Scenario: Member changes selection

- **WHEN** a group member taps a different Quick Reply button after having already selected
- **THEN** the system SHALL update the member's OrderItem to the new selection and confirm the change

#### Scenario: Selection rejected on confirmed order

- **WHEN** a group member taps a Quick Reply button on an order with status `confirmed` or `closed`
- **THEN** the system SHALL reply with a message that the order is already confirmed and no changes are accepted

### Requirement: View Order Tally

The system SHALL allow the organizer to view a summary of all current selections by sending `/統計`. The summary SHALL list each member's name, selected item, and price, plus a grand total item count and total amount.

#### Scenario: Organizer views tally with selections

- **WHEN** organizer sends `/統計` and at least one member has selected an item
- **THEN** the system SHALL reply with a message listing each member's selection and price, and the total amount

#### Scenario: Organizer views tally with no selections

- **WHEN** organizer sends `/統計` and no member has selected yet
- **THEN** the system SHALL reply indicating no selections have been made

### Requirement: Confirm Order

The system SHALL allow the organizer to lock the active order by sending `/確認下單`. The order status SHALL change from `open` to `confirmed`. Once confirmed, no further item selections SHALL be accepted. The system SHALL trigger the payment notification flow upon confirmation.

#### Scenario: Organizer confirms an order with selections

- **WHEN** organizer sends `/確認下單` on an `open` order that has at least one selection
- **THEN** the system SHALL update the order status to `confirmed` and proceed to send payment notifications to all members who selected items

#### Scenario: Confirm rejected on empty order

- **WHEN** organizer sends `/確認下單` on an `open` order with no selections
- **THEN** the system SHALL reply with an error message indicating no items have been selected
