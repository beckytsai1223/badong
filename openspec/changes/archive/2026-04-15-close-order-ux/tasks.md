## 1. 指令改名（Organizer Command Routing）

- [x] 1.1 [Organizer Command Routing] 在 `src/bot/handlers.js` 的 organizer 權限檢查清單中，將 `text === '/取消訂單'` 改為 `text === '/關閉訂單'`，並移除 `text.startsWith('/已收款')` 條件
- [x] 1.2 [Organizer Command Routing] 在 `src/bot/handlers.js` 的路由比對中，將 `if (text === '/取消訂單')` 改為 `if (text === '/關閉訂單')`，並移除 `/已收款` 的路由區塊（`if (text.startsWith('/已收款'))` 整段刪除）

## 2. 提示文字更新（Role-Aware Command Hints）

- [x] 2.1 [Role-Aware Command Hints] 在 `src/bot/commands.js` 的 `hint('open')` 主辦人版本中，將 `/取消訂單 → 取消整筆訂單` 改為 `/關閉訂單 → 關閉整筆訂單`
- [x] 2.2 [Role-Aware Command Hints] 在 `src/bot/commands.js` 的 `hint('confirmed')` 主辦人版本中，移除 `/已收款 <名字> → 標記已收款\n` 這一行，並將 `/取消訂單 → 關閉訂單` 改為 `/關閉訂單 → 關閉訂單`

## 3. 確認下單付款提示（Order Confirmation Payment Reminder）

- [x] 3.1 [Order Confirmation Payment Reminder] 在 `src/bot/commands.js` 的 `confirmOrder` 函式中，將 replyText 訊息改為：`✅ 訂單已確認！共 ${uniqueUsers} 人 ${items.length} 份，正在發送收款通知...\n\n請大家撥空付款，可現金、轉帳或 LINE Pay`

## 4. 付款通知改為 Flex Message（Payment Notification Text）

- [x] 4.1 [Payment Notification Text] 在 `src/db/queries.js` 新增 `markPaidByUserId(orderId, userId)` 函式，執行 `UPDATE payments SET paid = 1 WHERE order_id = ? AND user_id = ?`，並加入 `module.exports`
- [x] 4.2 [Payment Notification Text] 在 `src/bot/messages.js` 將 `buildPaymentNotificationMessage` 改回傳 Flex Message：header 顯示「💳 付款確認」，body 列出每位成員的品項與小計及合計金額，footer 放三顆 postback 按鈕（現金 `method=cash`、轉帳 `method=transfer`、LINE Pay `method=linepay`），移除原本的 `type: 'text'` 與 `quickReply` 屬性

## 5. 自助回報付款（Self-Report Payment）

- [x] 5.1 [Self-Report Payment] 在 `src/bot/commands.js` 的 `setPaymentMethod` 函式中，於 `db.upsertPayment(...)` 之後呼叫 `db.markPaidByUserId(orderId, userId)`，使成員點選後直接標記為已付款；將 `'您的款項已由主辦人標記為已收，無法更改。'` 訊息改為 `'您已回報付款，無法更改。'`
- [x] 5.2 [Self-Report Payment] 在 `src/bot/commands.js` 中刪除 `markMemberPaid` 函式，並從 `module.exports` 移除該函式

## 6. Help 指令（Help Command）

- [x] 6.1 [Help Command] 在 `src/bot/commands.js` 新增 `helpMessage(userId)` 函式，依 `isOrganizer(userId)` 回傳對應的完整說明文字（主辦人版或一般成員版，內容如 spec 所定義），並加入 `module.exports`
- [x] 6.2 [Help Command] 在 `src/bot/handlers.js` 的 `handleTextMessage` 中，於 `/我的ID` 路由之後加入：`if (text === '/help') return commands.helpMessage` 的呼叫，且不需要 organizer 權限檢查；呼叫方式：`return client.replyMessage({ replyToken, messages: [{ type: 'text', text: commands.helpMessage(userId) }] })`

## 7. 主辦人自動標記付款（Organizer Auto-Payment）

- [x] 7.1 [Organizer Auto-Payment] 在 `src/bot/commands.js` 的 `confirmOrder` 函式中，於 `db.updateOrderStatus(order.id, 'confirmed')` 之後，呼叫 `const displayName = await getDisplayName(client, event)`，再呼叫 `db.upsertPayment(order.id, userId, displayName, 'organizer')` 與 `db.markPaidByUserId(order.id, userId)`（`userId` 為 `event.source.userId`），自動將主辦人標記為已付款
