'use strict';

/**
 * Flex Message Menu Rendering
 * buildMenuFlexMessage(order, menuItems) → LINE Flex Message JSON
 * Each menu item is a row with an inline button using postbackAction.
 * Buttons are inside the bubble body — they persist after any user taps,
 * allowing all group members to order independently.
 */
function buildMenuFlexMessage(order, menuItems) {
  return {
    type: 'flex',
    altText: `📋 ${order.restaurant_name} 菜單已開放點餐！`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `🍱 ${order.restaurant_name}`,
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
          },
        ],
        backgroundColor: '#2B7BB9',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: menuItems.map(item => ({
          type: 'box',
          layout: 'horizontal',
          alignItems: 'center',
          contents: [
            {
              type: 'text',
              text: item.name,
              flex: 3,
              size: 'md',
              wrap: true,
            },
            {
              type: 'text',
              text: `$${item.price}`,
              flex: 1,
              align: 'end',
              color: '#555555',
              size: 'md',
            },
            {
              type: 'button',
              flex: 2,
              style: 'primary',
              height: 'sm',
              action: {
                type: 'postback',
                label: '點選',
                data: `action=select_item&order_id=${order.id}&item_id=${item.id}`,
                displayText: `${item.name} $${item.price}`,
              },
            },
          ],
        })),
      },
    },
  };
}

/**
 * Build payment notification message with Quick Reply buttons for payment method.
 * action=set_payment&order_id=<id>&method=<method>
 */
function buildPaymentNotificationMessage(order, orderItems) {
  // Group by user so each person sees their subtotal
  const byUser = {};
  for (const oi of orderItems) {
    if (!byUser[oi.user_id]) byUser[oi.user_id] = { name: oi.user_name, items: [], total: 0 };
    byUser[oi.user_id].items.push(oi.item_name);
    byUser[oi.user_id].total += oi.price;
  }
  const lines = Object.values(byUser).map(u =>
    `• ${u.name}：${u.items.join('、')} → $${u.total}`
  );
  const total = orderItems.reduce((sum, oi) => sum + oi.price, 0);

  const methods = ['cash', 'transfer', 'linepay'];
  const labels = { cash: '現金', transfer: '轉帳', linepay: 'LINE Pay' };

  const quickReplies = methods.map(method => ({
    type: 'action',
    action: {
      type: 'postback',
      label: labels[method],
      data: `action=set_payment&order_id=${order.id}&method=${method}`,
      displayText: `付款方式：${labels[method]}`,
    },
  }));

  return {
    type: 'text',
    text: `✅ 訂單已確認！\n\n${lines.join('\n')}\n\n合計：$${total}\n\n請選擇付款方式 👇`,
    quickReply: {
      items: quickReplies,
    },
  };
}

module.exports = { buildMenuFlexMessage, buildPaymentNotificationMessage };
