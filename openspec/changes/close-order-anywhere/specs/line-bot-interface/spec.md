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

**`/關閉訂單` SHALL be evaluated BEFORE the wizard session check.** If an organizer sends `/關閉訂單` while a wizard session is active, the system SHALL close the active order, clear the wizard session, and SHALL NOT forward the message to the wizard handler.

All other unrecognized messages during an active wizard session (menu item entry) SHALL be forwarded to the wizard handler. All other unrecognized messages SHALL be silently ignored.

#### Scenario: Recognized command is routed

- **WHEN** a user sends `/統計` in the group
- **THEN** the system SHALL invoke the view-tally handler and reply with the tally

#### Scenario: /關閉訂單 is routed to cancel handler

- **WHEN** an organizer sends `/關閉訂單`
- **THEN** the system SHALL invoke the cancel-order handler and close the active order

#### Scenario: /關閉訂單 interrupts an active wizard session

- **WHEN** an organizer sends `/關閉訂單` while a wizard session is active (in `adding_items`, `setting_threshold`, or `confirming_menu` state)
- **THEN** the system SHALL close the active order and set its status to `closed`
- **THEN** the system SHALL clear the organizer's wizard session
- **THEN** the system SHALL reply confirming the order has been cancelled
- **THEN** the system SHALL NOT treat the message as a menu item input

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
