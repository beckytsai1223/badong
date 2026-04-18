## MODIFIED Requirements

### Requirement: Publish Menu to Group

The system SHALL provide a `/發布菜單` command that sends the current open order's menu Flex Message to the group where the command was sent.

The command SHALL be restricted to organizers only. If a non-organizer sends `/發布菜單`, the system SHALL reply with an error message and SHALL NOT send the menu.

If there is no active order in `open` status, the system SHALL reply with an error message indicating no open order exists.

The menu Flex Message and the confirmation text SHALL be sent in a single `replyMessage` call (two messages in one reply). The system SHALL NOT call `pushMessage` for this command.

#### Scenario: Organizer publishes menu to group

- **WHEN** an organizer sends `/發布菜單` in a group where an `open` order exists
- **THEN** the system SHALL send both the menu Flex Message and the confirmation text "✅ 菜單已發布至群組。" to the group in a single reply
- **THEN** the system SHALL NOT call `pushMessage`

#### Scenario: Non-organizer attempts to publish menu

- **WHEN** a non-organizer sends `/發布菜單`
- **THEN** the system SHALL reply with an error message (e.g., "只有主辦人可以發布菜單。")
- **THEN** the system SHALL NOT push the menu to the group

#### Scenario: No open order when publishing

- **WHEN** an organizer sends `/發布菜單` but no order with `open` status exists
- **THEN** the system SHALL reply with an error message (e.g., "目前沒有開放中的訂單可以發布。")
- **THEN** the system SHALL NOT send any message to the group

---

### Requirement: Payment Notification Text

The payment notification message sent to the group after order confirmation SHALL list each participant's ordered items and subtotal, and the grand total. The message SHALL be a Flex Message containing three inline payment method buttons: 已完成現金付款, 已完成轉帳付款, 已完成 LINE Pay 付款. Each button SHALL trigger a postback with format `action=set_payment&order_id=<id>&method=<method>`. The message SHALL NOT include Quick Reply buttons. The message SHALL NOT include the text "請選擇付款方式".

The payment notification Flex Message and the order confirmation text SHALL be sent in a single `replyMessage` call (two messages in one reply). The system SHALL NOT call `pushMessage` for the payment notification.

#### Scenario: Payment notification is Flex Message with inline buttons

- **WHEN** the organizer confirms an order
- **THEN** the system SHALL send the confirmation text and the payment notification Flex Message together in a single reply to the group
- **THEN** the notification SHALL be a Flex Message showing each user's items, subtotal per user, and grand total
- **THEN** the notification SHALL contain three buttons labeled 已完成現金付款, 已完成轉帳付款, 已完成 LINE Pay 付款
- **THEN** the notification text SHALL NOT contain "請選擇付款方式"
- **THEN** the notification SHALL NOT carry Quick Reply buttons
- **THEN** the system SHALL NOT call `pushMessage`

## ADDED Requirements

### Requirement: Menu Re-display After Item Selection

After a member successfully selects a menu item, the system SHALL send both the confirmation text and the menu Flex Message in a single `replyMessage` call (two messages in one reply), so the menu remains accessible at the bottom of the chat. The system SHALL NOT call `pushMessage` to re-display the menu.

#### Scenario: Menu is bundled in reply after item selection

- **WHEN** a member taps a menu item button and the item is successfully recorded
- **THEN** the system SHALL reply with the confirmation text (e.g., "✅ 已加入：...") and the menu Flex Message together in a single reply
- **THEN** the system SHALL NOT call `pushMessage`

#### Scenario: Menu re-display does not consume push quota

- **WHEN** five members each tap a menu item button
- **THEN** the system SHALL produce five reply messages (one per postback event) and SHALL call `pushMessage` zero times
