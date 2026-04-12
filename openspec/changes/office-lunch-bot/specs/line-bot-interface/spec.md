## ADDED Requirements

### Requirement: Webhook Signature Verification

The system SHALL verify the `X-Line-Signature` header on every incoming webhook request using the channel secret. Requests with an invalid or missing signature SHALL be rejected with HTTP 400 and SHALL NOT be processed.

#### Scenario: Valid webhook request is processed

- **WHEN** a webhook POST request arrives with a valid `X-Line-Signature` header
- **THEN** the system SHALL process the event payload normally

#### Scenario: Invalid signature is rejected

- **WHEN** a webhook POST request arrives with an invalid or missing `X-Line-Signature` header
- **THEN** the system SHALL respond with HTTP 400 and SHALL NOT process the event

### Requirement: Organizer Command Routing

The system SHALL recognize the following text commands sent by any user in the group and route them to the appropriate handler. Commands SHALL be matched by prefix (case-insensitive for the command keyword):

| Command | Handler |
|---|---|
| `/新增訂單 <restaurant>` | Create order session |
| `/統計` | View order tally |
| `/確認下單` | Confirm order |
| `/已收款 <name>` | Mark member as paid |
| `/收款狀態` | View payment status |

Unrecognized messages during an active wizard session (menu item entry) SHALL be forwarded to the wizard handler. All other unrecognized messages SHALL be silently ignored.

#### Scenario: Recognized command is routed

- **WHEN** a user sends `/統計` in the group
- **THEN** the system SHALL invoke the view-tally handler and reply with the tally

#### Scenario: Unrecognized message during wizard is forwarded

- **WHEN** a user sends a plain text message while an item-entry wizard session is active for that user
- **THEN** the system SHALL forward the message to the wizard handler

#### Scenario: Unrecognized message outside wizard is ignored

- **WHEN** a user sends a plain text message that does not match any command and no wizard is active
- **THEN** the system SHALL not reply

### Requirement: Flex Message Menu Rendering

The system SHALL render the active order's menu as a LINE Flex Message containing the restaurant name as the header and one Quick Reply button per menu item. Each Quick Reply button SHALL display the item name and price, and SHALL carry a postback payload in the format `action=select_item&order_id=<id>&item_id=<id>`.

#### Scenario: Flex Message is sent after menu entry completes

- **WHEN** the organizer ends the menu-entry dialog
- **THEN** the system SHALL send a Flex Message to the group with the restaurant name and one Quick Reply button per menu item (showing name and price)

#### Scenario: Flex Message Quick Reply carries correct postback

- **WHEN** a Quick Reply button in the menu Flex Message is tapped
- **THEN** the postback data SHALL be in the format `action=select_item&order_id=<id>&item_id=<id>` with the correct IDs

### Requirement: Postback Event Handling

The system SHALL handle LINE postback events triggered by Quick Reply button taps. The system SHALL parse the `data` field as a query string and dispatch to the correct handler based on the `action` parameter. Supported actions: `select_item`, `set_payment`. Unknown actions SHALL be silently ignored.

#### Scenario: select_item postback is dispatched

- **WHEN** a postback event arrives with `action=select_item`
- **THEN** the system SHALL invoke the select-item handler with the parsed `order_id` and `item_id`

#### Scenario: set_payment postback is dispatched

- **WHEN** a postback event arrives with `action=set_payment`
- **THEN** the system SHALL invoke the set-payment-method handler with the parsed `order_id` and `method`

#### Scenario: Unknown action is ignored

- **WHEN** a postback event arrives with an unrecognized `action` value
- **THEN** the system SHALL not reply and SHALL not throw an error
