## ADDED Requirements

### Requirement: Send Payment Notifications

When an order is confirmed, the system SHALL send a payment notification message to the LINE group listing each member's name, selected item, price, and a Quick Reply to select their payment method (cash / bank transfer / LINE Pay).

#### Scenario: Payment notification sent after order confirmation

- **WHEN** the order status transitions to `confirmed`
- **THEN** the system SHALL send one group message listing all members with their item and amount due, and provide Quick Reply buttons for each payment method: 現金, 轉帳, LINE Pay

### Requirement: Record Payment Method

The system SHALL allow each member to select their payment method by tapping a Quick Reply button in the payment notification. The selection SHALL be stored in the Payment record for that member and order. A member MAY change their payment method before the organizer marks them as paid.

#### Scenario: Member selects payment method

- **WHEN** a member taps a payment method Quick Reply button (現金, 轉帳, or LINE Pay) after order confirmation
- **THEN** the system SHALL save the payment method for that member and reply with a confirmation message

#### Scenario: Member changes payment method before being marked paid

- **WHEN** a member taps a different payment method Quick Reply button before being marked paid
- **THEN** the system SHALL update the payment method and confirm the change

#### Scenario: Payment method change rejected after marked paid

- **WHEN** a member taps a payment method Quick Reply button after the organizer has already marked them as paid
- **THEN** the system SHALL reply informing the member that their payment has already been recorded

### Requirement: Mark Member as Paid

The system SHALL allow the organizer to mark a specific member as paid by sending `/已收款 <name>`. The Payment record for that member SHALL be updated with `paid = true`. The name matching SHALL be case-insensitive and match against the member's LINE display name stored at order time.

#### Scenario: Organizer marks a member as paid

- **WHEN** organizer sends `/已收款 王小明`
- **THEN** the system SHALL find the Payment record for the member with matching display name in the active confirmed order, set `paid = true`, and reply with a confirmation

#### Scenario: Mark paid rejected for unknown name

- **WHEN** organizer sends `/已收款 <name>` and no matching member exists in the current order
- **THEN** the system SHALL reply with an error listing the valid member names

### Requirement: View Payment Status

The system SHALL allow the organizer to view the current payment status by sending `/收款狀態`. The reply SHALL list each member's name, payment method, and paid status (已付 / 未付).

#### Scenario: Organizer views payment status

- **WHEN** organizer sends `/收款狀態` on a confirmed order
- **THEN** the system SHALL reply with a list of all members showing name, payment method (or 未選擇 if not yet selected), and paid status

#### Scenario: Payment status rejected on open order

- **WHEN** organizer sends `/收款狀態` while order status is `open`
- **THEN** the system SHALL reply indicating the order has not been confirmed yet
