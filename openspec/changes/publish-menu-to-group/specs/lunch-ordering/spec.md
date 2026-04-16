## ADDED Requirements

### Requirement: Menu Publication Trigger

The system SHALL support `/發布菜單` as an explicit trigger for making an open order's menu available to group members. This supplements the existing flow where the menu appears only in the organizer's private chat after wizard completion.

When an organizer executes `/發布菜單` in a group, the system SHALL push the current open order's menu Flex Message to that group, allowing members to start selecting items.

#### Scenario: Menu becomes accessible to group after publish

- **WHEN** an organizer sends `/發布菜單` in a group and a valid `open` order exists
- **THEN** all members of that group SHALL receive the menu Flex Message
- **THEN** group members SHALL be able to tap menu item buttons to place their selections
