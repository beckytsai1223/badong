## MODIFIED Requirements

### Requirement: Flex Message Menu Rendering

The system SHALL render the active order's menu as a LINE Flex Message with the following header structure:

- **Title line**: `🍱 <restaurant_name>` if `meal_label` is NULL or empty; `🍱 <restaurant_name>｜<meal_label>` if `meal_label` is set
- **Subtitle line**: Fixed text `請直接在下方點選點餐` (small font, light color), always present regardless of `meal_label`
- **Deadline line**: `⏰ 截止：<order_deadline>` (small font, light color), present only when `order_deadline` is non-NULL

The body SHALL contain one row per menu item, each with the item name, price, and a postback button labeled `點選`. Each button SHALL carry a postback payload in the format `action=select_item&order_id=<id>&item_id=<id>`.

#### Scenario: Flex Message is sent after menu entry completes

- **WHEN** the organizer ends the menu-entry dialog
- **THEN** the system SHALL send a Flex Message to the group with the restaurant name (and meal label if set) in the header title, the fixed subtitle "請直接在下方點選點餐", and one row per menu item showing name, price, and a 點選 button

#### Scenario: Flex Message header shows meal label when set

- **WHEN** the active order has a non-NULL `meal_label` (e.g., "明天午餐")
- **THEN** the Flex Message header title SHALL be `🍱 <restaurant_name>｜<meal_label>` (e.g., "🍱 便當店｜明天午餐")

#### Scenario: Flex Message header shows only restaurant name when meal label is absent

- **WHEN** the active order has a NULL `meal_label`
- **THEN** the Flex Message header title SHALL be `🍱 <restaurant_name>` with no separator or label

#### Scenario: Flex Message always shows fixed subtitle

- **WHEN** a menu Flex Message is rendered (regardless of meal_label)
- **THEN** the header SHALL include a subtitle line with the text "請直接在下方點選點餐"

#### Scenario: Flex Message shows deadline line when set

- **WHEN** the active order has a non-NULL `order_deadline` (e.g., "4月18號中午12點")
- **THEN** the Flex Message header SHALL include a third line with the text `⏰ 截止：4月18號中午12點`

#### Scenario: Flex Message omits deadline line when not set

- **WHEN** the active order has a NULL `order_deadline`
- **THEN** the Flex Message header SHALL NOT include a deadline line

#### Scenario: Flex Message Quick Reply carries correct postback

- **WHEN** a 點選 button in the menu Flex Message is tapped
- **THEN** the postback data SHALL be in the format `action=select_item&order_id=<id>&item_id=<id>` with the correct IDs
