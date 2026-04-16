## MODIFIED Requirements

### Requirement: Send Payment Notifications

When an order is confirmed, the system SHALL send a payment notification as a Flex Message to the LINE group. The Flex Message SHALL list each member (excluding the organizer) in a vertical layout: the first row SHALL show the member's name and amount side-by-side (each occupying 50% width), and the second row SHALL show the member's ordered items in a smaller, wrapped font. A grand total SHALL appear below a separator. The footer SHALL contain an instruction text followed by inline postback buttons for the three payment methods.

**Footer instruction text:** The footer SHALL begin with the text `請同仁付完款後，直接點選以下的付款方式` rendered as a text element above the three payment method buttons. The text element SHALL appear before any button elements in the footer `contents` array.

#### Scenario: Payment notification includes instruction text above buttons

- **WHEN** the order status transitions to `confirmed` and the system sends the payment notification Flex Message
- **THEN** the Flex Message footer SHALL contain a text element with `請同仁付完款後，直接點選以下的付款方式` as the first element in the footer `contents` array
- **THEN** the three payment method buttons (現金, 轉帳, LINE Pay) SHALL appear after the instruction text element

#### Scenario: Payment notification sent after order confirmation

- **WHEN** the order status transitions to `confirmed`
- **THEN** the system SHALL send a Flex Message to the group with one vertical entry per non-organizer member showing their name, amount, and ordered items, followed by a grand total, and three payment method postback buttons in the footer
