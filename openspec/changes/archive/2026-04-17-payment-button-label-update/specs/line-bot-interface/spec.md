## MODIFIED Requirements

### Requirement: Payment Notification Text

The payment notification message pushed to the group after order confirmation SHALL list each participant's ordered items and subtotal, and the grand total. The message SHALL be a Flex Message containing three inline payment method buttons: 已完成現金付款, 已完成轉帳付款, 已完成 LINE Pay 付款. Each button SHALL trigger a postback with format `action=set_payment&order_id=<id>&method=<method>`. The message SHALL NOT include Quick Reply buttons. The message SHALL NOT include the text "請選擇付款方式".

#### Scenario: Payment notification is Flex Message with inline buttons

- **WHEN** the organizer confirms an order and the system pushes the payment notification to the group
- **THEN** the notification SHALL be a Flex Message showing each user's items, subtotal per user, and grand total
- **THEN** the notification SHALL contain three buttons labeled 已完成現金付款, 已完成轉帳付款, 已完成 LINE Pay 付款
- **THEN** the notification text SHALL NOT contain "請選擇付款方式"
- **THEN** the notification SHALL NOT carry Quick Reply buttons
