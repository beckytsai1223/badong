## MODIFIED Requirements

### Requirement: Create Order Session

The system SHALL allow the organizer to create a new ordering session by providing a restaurant name via the `/新增訂單 <restaurant>` command. After saving the new order, the system SHALL enter a `setting_threshold` wizard state and prompt the organizer to optionally enter a delivery threshold amount. After the threshold step (whether set or skipped), the wizard SHALL transition to the `adding_items` state to collect menu items one by one. Each menu item SHALL have a name and price. The dialog SHALL end when the organizer sends an empty message or a designated end command. Only one active order (status `open`) SHALL exist at a time; attempting to create a new one while another is active SHALL be rejected with an error message.

#### Scenario: Organizer creates a new order

- **WHEN** organizer sends `/新增訂單 老媽便當` in the group
- **THEN** the system SHALL save a new order with restaurant_name "老媽便當" and status `open`, set the session state to `setting_threshold`, and prompt the organizer to enter a delivery threshold amount or `/略過`

#### Scenario: Organizer adds menu items via multi-turn dialog

- **WHEN** organizer sends a menu item in the format `排骨飯 80` (name space price) during the `adding_items` state
- **THEN** the system SHALL save the menu item and confirm the addition, then prompt for the next item

#### Scenario: Organizer ends menu entry

- **WHEN** organizer sends an empty message or `/完成` during the `adding_items` dialog
- **THEN** the system SHALL end the dialog, send a Flex Message to the group displaying the full menu with postback selection buttons

#### Scenario: Create order rejected when another is active

- **WHEN** organizer sends `/新增訂單` while an order with status `open` or `confirmed` exists
- **THEN** the system SHALL reply with an error message indicating an active order already exists

---

### Requirement: View Order Tally

The system SHALL allow the organizer to view a summary of all current selections by sending `/統計`. The summary SHALL list each member's name, selected item, and price, plus a grand total item count and total amount. If the order has a `delivery_threshold`, the system SHALL additionally display whether the grand total meets or falls short of the threshold.

#### Scenario: Organizer views tally with selections

- **WHEN** organizer sends `/統計` and at least one member has selected an item
- **THEN** the system SHALL reply with a message listing each member's selection and price, the total amount, and (if `delivery_threshold` is set) the threshold status

#### Scenario: Organizer views tally with no selections

- **WHEN** organizer sends `/統計` and no member has selected yet
- **THEN** the system SHALL reply indicating no selections have been made
