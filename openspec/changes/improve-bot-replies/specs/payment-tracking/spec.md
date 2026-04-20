## MODIFIED Requirements

### Requirement: Record Payment Method

The system SHALL allow each member to select their payment method exactly once by tapping a postback button in the payment notification Flex Message. The selection SHALL be stored in the Payment record (`paid = 1`) for that member and order. The system SHALL NOT send any reply message to the member after a successful first-time payment selection. If a member taps a payment method button a second time, the system SHALL reply with "您已選擇付款方式，選擇後無法更改。" and SHALL NOT modify the existing payment record.

#### Scenario: Member selects payment method silently

- **WHEN** a group member taps a payment method button (現金, 轉帳, or LINE Pay) in the payment notification Flex Message and has no existing payment record with `paid = 1`
- **THEN** the system SHALL save the payment method with `paid = 1` for that member
- **THEN** the system SHALL NOT send any confirmation reply

#### Scenario: Duplicate tap rejected

- **WHEN** a member taps any payment method button and their payment record already has `paid = 1`
- **THEN** the system SHALL reply with "您已選擇付款方式，選擇後無法更改。" and SHALL NOT alter the existing payment record
