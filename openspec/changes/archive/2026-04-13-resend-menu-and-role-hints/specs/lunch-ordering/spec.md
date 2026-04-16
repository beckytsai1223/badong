## MODIFIED Requirements

### Requirement: Select Menu Item

The system SHALL allow group members to select one or more menu items from the active order by tapping buttons in the menu Flex Message. Each tap SHALL record a new OrderItem linked to the member's LINE userId and display name. Multiple taps by the same member SHALL accumulate (not replace) their selections. Selection SHALL only be accepted when order status is `open`.

After recording a selection, the system SHALL push a new copy of the menu Flex Message to the group, so that the menu remains visible at the bottom of the chat for members who joined later.

#### Scenario: Member selects a menu item

- **WHEN** a group member taps a menu item button on an `open` order
- **THEN** the system SHALL record a new OrderItem for that member and reply with a confirmation showing the selected item, all of the member's current selections, and their running total

#### Scenario: Menu is re-pushed after selection

- **WHEN** a group member successfully selects a menu item
- **THEN** the system SHALL push a new menu Flex Message to the group immediately after the reply

#### Scenario: Selection rejected on confirmed order

- **WHEN** a group member taps a menu item button on an order with status `confirmed` or `closed`
- **THEN** the system SHALL reply with a message that the order is already confirmed and no changes are accepted

---

### Requirement: Cancel Own Order Items

The system SHALL allow any group member to cancel all of their own item selections for the active `open` order by sending `/取消餐點` (without a name argument). After successful cancellation, the system SHALL push a new copy of the menu Flex Message to the group so the member can immediately re-select.

#### Scenario: Member cancels own selections and menu is re-pushed

- **WHEN** a group member sends `/取消餐點` and they have at least one selection on an `open` order
- **THEN** the system SHALL delete all of that member's OrderItems for the active order, reply with a confirmation, and push a new menu Flex Message to the group

#### Scenario: Cancel with no selections

- **WHEN** a group member sends `/取消餐點` and they have no selections on the active order
- **THEN** the system SHALL reply indicating there are no items to cancel and SHALL NOT push a menu
