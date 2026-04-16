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
| `/發布菜單` | Publish menu to the group (organizer only) |

Unrecognized messages during an active wizard session (menu item entry) SHALL be forwarded to the wizard handler. All other unrecognized messages SHALL be silently ignored.

#### Scenario: Recognized command is routed

- **WHEN** a user sends `/統計` in the group
- **THEN** the system SHALL invoke the view-tally handler and reply with the tally

#### Scenario: /關閉訂單 is routed to cancel handler

- **WHEN** an organizer sends `/關閉訂單`
- **THEN** the system SHALL invoke the cancel-order handler and close the active order

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

## ADDED Requirements

### Requirement: Publish Menu to Group

The system SHALL provide a `/發布菜單` command that pushes the current open order's menu Flex Message to the group where the command was sent.

The command SHALL be restricted to organizers only. If a non-organizer sends `/發布菜單`, the system SHALL reply with an error message and SHALL NOT push the menu.

If there is no active order in `open` status, the system SHALL reply with an error message indicating no open order exists.

#### Scenario: Organizer publishes menu to group

- **WHEN** an organizer sends `/發布菜單` in a group where an `open` order exists
- **THEN** the system SHALL push the menu Flex Message to that group using the group's `groupId`
- **THEN** the system SHALL reply to the organizer confirming the menu has been published

#### Scenario: Non-organizer attempts to publish menu

- **WHEN** a non-organizer sends `/發布菜單`
- **THEN** the system SHALL reply with an error message (e.g., "只有主辦人可以發布菜單。")
- **THEN** the system SHALL NOT push the menu to the group

#### Scenario: No open order when publishing

- **WHEN** an organizer sends `/發布菜單` but no order with `open` status exists
- **THEN** the system SHALL reply with an error message (e.g., "目前沒有開放中的訂單可以發布。")
- **THEN** the system SHALL NOT push any message to the group
