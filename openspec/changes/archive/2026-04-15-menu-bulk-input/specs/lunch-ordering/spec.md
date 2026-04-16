## MODIFIED Requirements

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
