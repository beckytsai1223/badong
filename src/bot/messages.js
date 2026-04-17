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
            text: order.meal_label ? `🍱 ${order.restaurant_name}｜${order.meal_label}` : `🍱 ${order.restaurant_name}`,
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
          },
          {
            type: 'text',
            text: '請直接在下方點選點餐',
            size: 'sm',
            color: '#cce4f7',
            wrap: true,
          },
          ...(order.order_deadline ? [{
            type: 'text',
            text: `⏰ 截止：${order.order_deadline}`,
            size: 'sm',
            color: '#cce4f7',
            wrap: true,
          }] : []),
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
 * Build payment notification as a Flex Message with inline payment method buttons.
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
  const total = orderItems.reduce((sum, oi) => sum + oi.price, 0);

  const userRows = Object.values(byUser).map(u => ({
    type: 'box',
    layout: 'vertical',
    margin: 'sm',
    contents: [
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'text', text: u.name, flex: 1, size: 'sm', weight: 'bold' },
          { type: 'text', text: `$${u.total}`, flex: 1, size: 'sm', align: 'end', color: '#333333' },
        ],
      },
      {
        type: 'text',
        text: u.items.join('、'),
        size: 'sm',
        color: '#888888',
        wrap: true,
      },
    ],
  }));

  const methods = [
    { method: 'cash', label: '現金' },
    { method: 'transfer', label: '轉帳' },
    { method: 'linepay', label: 'LINE Pay' },
  ];

  const paymentButtons = methods.map(({ method, label }) => ({
    type: 'button',
    style: 'primary',
    height: 'sm',
    action: {
      type: 'postback',
      label,
      data: `action=set_payment&order_id=${order.id}&method=${method}`,
      displayText: `付款方式：${label}`,
    },
  }));

  return {
    type: 'flex',
    altText: `💳 ${order.restaurant_name} 付款確認`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '💳 付款確認', weight: 'bold', size: 'lg', color: '#ffffff' },
          { type: 'text', text: order.restaurant_name, size: 'sm', color: '#ffffffcc' },
        ],
        backgroundColor: '#2B7BB9',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          ...userRows,
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              { type: 'text', text: '合計', flex: 3, weight: 'bold', size: 'sm' },
              { type: 'text', text: `$${total}`, flex: 5, weight: 'bold', size: 'sm', align: 'end', color: '#2B7BB9' },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: '請同仁付完款後，直接點選以下的付款方式',
            size: 'sm',
            color: '#555555',
            wrap: true,
          },
          ...paymentButtons,
        ],
      },
    },
  };
}

module.exports = { buildMenuFlexMessage, buildPaymentNotificationMessage };
