## ADDED Requirements

### Requirement: Cancel Order Reply

When the organizer closes an active order via `/關閉訂單`, the system SHALL reply with `🔒 訂單「<restaurant_name>」已關閉。`. The reply SHALL NOT include any "可用指令" hint block.

#### Scenario: Organizer closes an order

- **WHEN** the organizer sends `/關閉訂單` and an active order exists
- **THEN** the system SHALL reply with `🔒 訂單「<restaurant_name>」已關閉。`
- **THEN** the reply SHALL NOT contain any "可用指令" text or hint block
