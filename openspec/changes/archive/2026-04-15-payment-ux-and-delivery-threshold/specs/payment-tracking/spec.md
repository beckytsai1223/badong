## MODIFIED Requirements

### Requirement: Send Payment Notifications

When an order is confirmed, the system SHALL send a payment notification as a Flex Message to the LINE group. The Flex Message SHALL list each member (excluding the organizer) in a vertical layout: the first row SHALL show the member's name and amount side-by-side (each occupying 50% width), and the second row SHALL show the member's ordered items in a smaller, wrapped font. A grand total SHALL appear below a separator. The footer SHALL contain inline postback buttons for the three payment methods: 現金, 轉帳, LINE Pay.

#### Scenario: Payment notification sent after order confirmation

- **WHEN** the order status transitions to `confirmed`
- **THEN** the system SHALL send a Flex Message to the group with one vertical entry per non-organizer member showing their name, amount, and ordered items, followed by a grand total, and three payment method postback buttons in the footer

---

### Requirement: Record Payment Method

The system SHALL allow each member to select their payment method exactly once by tapping a postback button in the payment notification Flex Message. The selection SHALL be stored in the Payment record (`paid = 1`) for that member and order. If a member taps a payment method button a second time, the system SHALL reply with "您已選擇付款方式，選擇後無法更改。" and SHALL NOT modify the existing payment record.

#### Scenario: Member selects payment method

- **WHEN** a group member taps a payment method button (現金, 轉帳, or LINE Pay) in the payment notification Flex Message and has no existing payment record with `paid = 1`
- **THEN** the system SHALL save the payment method with `paid = 1` for that member and reply with a confirmation message

#### Scenario: Duplicate tap rejected

- **WHEN** a member taps any payment method button and their payment record already has `paid = 1`
- **THEN** the system SHALL reply with "您已選擇付款方式，選擇後無法更改。" and SHALL NOT alter the existing payment record

---

### Requirement: View Payment Status

The system SHALL allow the organizer to view the complete payment status by sending `/收款狀態`. The reply SHALL list every member who placed an order (derived from `order_items`), excluding the organizer. Members with a payment record (`paid = 1`) SHALL show their payment method label. Members with no payment record or `paid = 0` SHALL show "未選擇｜未付". The denominator for the paid/total count SHALL be the number of non-organizer members who placed an order.

#### Scenario: Organizer views payment status with mixed results

- **WHEN** organizer sends `/收款狀態` on a confirmed order that has both paid and unpaid members
- **THEN** the system SHALL reply listing every non-organizer member: paid members with their payment method, unpaid members with "未選擇｜未付", and a summary count (e.g., "已付款 2/4 人")

#### Scenario: Organizer views payment status on open order

- **WHEN** organizer sends `/收款狀態` while order status is `open`
- **THEN** the system SHALL reply indicating the order has not been confirmed yet

## REMOVED Requirements

### Requirement: Mark Member as Paid

**Reason**: Payment is now self-reported by each member via the payment notification Flex Message buttons. The organizer no longer needs to manually mark individuals as paid.
**Migration**: Members tap a payment method button in the payment notification to self-report. The organizer uses `/收款狀態` to view the resulting status.

#### Scenario: Organizer attempts to use removed command

- **WHEN** organizer sends `/已收款 <name>` after this change is applied
- **THEN** the system SHALL NOT recognize the command and SHALL silently ignore it (unrecognized message outside wizard)
