'use strict';

const db = require('../db/queries');
const { buildMenuFlexMessage, buildPaymentNotificationMessage } = require('./messages');

// Helper: get display name from LINE profile, works in both group and 1-on-1
async function getDisplayName(client, event) {
  const userId = event.source.userId;
  const groupId = event.source.groupId;
  const roomId = event.source.roomId;
  try {
    if (groupId) {
      const profile = await client.getGroupMemberProfile(groupId, userId);
      return profile.displayName;
    }
    if (roomId) {
      const profile = await client.getRoomMemberProfile(roomId, userId);
      return profile.displayName;
    }
    const profile = await client.getProfile(userId);
    return profile.displayName;
  } catch (_) {
    return userId;
  }
}

// Helper: reply with a text message
async function replyText(client, replyToken, text) {
  return client.replyMessage({ replyToken, messages: [{ type: 'text', text }] });
}

// Helper: reply with a message object (flex, text with quickReply, etc.)
async function replyMessage(client, replyToken, message) {
  return client.replyMessage({ replyToken, messages: [message] });
}

// Helper: push message to a group/user (for payment notifications after confirm)
async function pushMessage(client, to, message) {
  return client.pushMessage({ to, messages: [message] });
}

// ─── Create Order Session ─────────────────────────────────────────────────────

async function createOrderSession(event, client, restaurant) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  if (!restaurant) {
    return replyText(client, replyToken, '請輸入店名，例如：/新增訂單 老媽便當');
  }

  const existing = db.getActiveOrder();
  if (existing) {
    return replyText(client, replyToken,
      `目前已有進行中的訂單（${existing.restaurant_name}，狀態：${existing.status}）。\n請等現有訂單結束後再建立新訂單。`
    );
  }

  const orderId = db.createOrder(restaurant, userId);
  db.setSession(userId, 'adding_items', { orderId, restaurantName: restaurant });

  return replyText(client, replyToken,
    `✅ 已建立「${restaurant}」訂單！\n\n請逐一輸入菜單項目，格式：\n  <品名> <價格>\n例如：排骨飯 80\n\n輸入完畢後請傳送「/完成」或空白訊息結束。`
  );
}

// ─── Wizard: menu item entry ───────────────────────────────────────────────────

async function handleWizardInput(event, client, text, session) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;
  const { orderId, restaurantName } = session.data;

  // End wizard
  if (text === '' || text === '/完成') {
    db.clearSession(userId);
    const order = db.getActiveOrder();
    const menuItems = db.getMenuItems(orderId);

    if (menuItems.length === 0) {
      return replyText(client, replyToken, '菜單沒有任何項目，訂單已取消。請重新建立訂單。');
    }

    const flexMsg = buildMenuFlexMessage(order, menuItems);
    return replyMessage(client, replyToken, flexMsg);
  }

  // Parse "<name> <price>"
  const match = text.match(/^(.+?)\s+(\d+)$/);
  if (!match) {
    return replyText(client, replyToken,
      '格式錯誤，請輸入：<品名> <價格>，例如：排骨飯 80\n或輸入「/完成」結束。'
    );
  }

  const [, name, priceStr] = match;
  const price = parseInt(priceStr, 10);
  db.addMenuItem(orderId, name, price);

  return replyText(client, replyToken,
    `✓ 已加入：${name} $${price}\n繼續輸入下一道，或傳送「/完成」結束。`
  );
}

// ─── Select Menu Item ─────────────────────────────────────────────────────────

async function selectItem(event, client, orderId, itemId) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;
  const userName = event.source.userId; // fallback; LINE doesn't expose display name in postback

  const order = db.getActiveOrder();
  if (!order || order.id !== orderId) {
    return replyText(client, replyToken, '此訂單不存在或已非進行中。');
  }
  if (order.status !== 'open') {
    return replyText(client, replyToken, '訂單已確認，不接受更改。');
  }

  const menuItems = db.getMenuItems(orderId);
  const item = menuItems.find(m => m.id === itemId);
  if (!item) {
    return replyText(client, replyToken, '找不到此餐點，請重新選擇。');
  }

  const displayName = await getDisplayName(client, event);

  db.addOrderItem(orderId, userId, displayName, itemId);

  // Show running total for this user
  const myItems = db.getOrderItems(orderId).filter(oi => oi.user_id === userId);
  const myTotal = myItems.reduce((sum, oi) => sum + oi.price, 0);
  const myList = myItems.map(oi => oi.item_name).join('、');

  return replyText(client, replyToken,
    `✅ 已加入：${item.name} $${item.price}\n${displayName} 目前：${myList}，共 $${myTotal}\n（輸入 /取消餐點 可清除重選）`
  );
}

// ─── View Order Tally ─────────────────────────────────────────────────────────

async function viewTally(event, client) {
  const replyToken = event.replyToken;
  const order = db.getActiveOrder();

  if (!order) {
    return replyText(client, replyToken, '目前沒有進行中的訂單。');
  }

  const items = db.getOrderItems(order.id);
  if (items.length === 0) {
    return replyText(client, replyToken,
      `📋 ${order.restaurant_name} — 目前沒有人選餐。`
    );
  }

  // Group by user
  const byUser = {};
  for (const oi of items) {
    if (!byUser[oi.user_id]) byUser[oi.user_id] = { name: oi.user_name, items: [], total: 0 };
    byUser[oi.user_id].items.push(oi.item_name);
    byUser[oi.user_id].total += oi.price;
  }
  const grandTotal = items.reduce((sum, oi) => sum + oi.price, 0);
  const lines = Object.values(byUser).map(u =>
    `• ${u.name}：${u.items.join('、')}（$${u.total}）`
  );
  lines.push(`\n合計：${items.length} 份，共 $${grandTotal}`);

  return replyText(client, replyToken,
    `📋 ${order.restaurant_name} 目前訂單：\n\n${lines.join('\n')}`
  );
}

// ─── Confirm Order ────────────────────────────────────────────────────────────

async function confirmOrder(event, client) {
  const replyToken = event.replyToken;
  const order = db.getActiveOrder();

  if (!order || order.status !== 'open') {
    return replyText(client, replyToken, '目前沒有可確認的訂單。');
  }

  const items = db.getOrderItems(order.id);
  if (items.length === 0) {
    return replyText(client, replyToken, '還沒有人選餐，無法確認下單。');
  }

  db.updateOrderStatus(order.id, 'confirmed');

  const uniqueUsers = new Set(items.map(i => i.user_id)).size;
  await replyText(client, replyToken,
    `✅ 訂單已確認！共 ${uniqueUsers} 人 ${items.length} 份，正在發送收款通知...`
  );

  // Send Payment Notifications to the group
  const sourceId = event.source.groupId || event.source.roomId || event.source.userId;
  const paymentMsg = buildPaymentNotificationMessage(order, items);
  return pushMessage(client, sourceId, paymentMsg);
}

// ─── Set Payment Method ───────────────────────────────────────────────────────

async function setPaymentMethod(event, client, orderId, method) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  const order = db.getActiveOrder();
  if (!order || order.id !== orderId) {
    return replyText(client, replyToken, '此訂單不存在。');
  }

  const payments = db.getPayments(orderId);
  const existing = payments.find(p => p.user_id === userId);
  if (existing && existing.paid) {
    return replyText(client, replyToken, '您的款項已由主辦人標記為已收，無法更改。');
  }

  const methodLabels = { cash: '現金', transfer: '轉帳', linepay: 'LINE Pay' };
  const label = methodLabels[method] || method;

  const displayName = await getDisplayName(client, event);

  db.upsertPayment(orderId, userId, displayName, method);

  return replyText(client, replyToken, `✅ 已記錄付款方式：${label}`);
}

// ─── Mark Member as Paid ──────────────────────────────────────────────────────

async function markMemberPaid(event, client, name) {
  const replyToken = event.replyToken;

  if (!name) {
    return replyText(client, replyToken, '請輸入姓名，例如：/已收款 王小明');
  }

  const order = db.getActiveOrder();
  if (!order || order.status !== 'confirmed') {
    return replyText(client, replyToken, '目前沒有已確認的訂單。');
  }

  const success = db.markPaid(order.id, name);
  if (!success) {
    const payments = db.getPayments(order.id);
    const names = payments.map(p => p.user_name).join('、');
    return replyText(client, replyToken,
      `找不到「${name}」。\n目前收款名單：${names || '（無）'}`
    );
  }

  return replyText(client, replyToken, `✅ 已標記「${name}」收款完成。`);
}

// ─── View Payment Status ──────────────────────────────────────────────────────

async function viewPaymentStatus(event, client) {
  const replyToken = event.replyToken;
  const order = db.getActiveOrder();

  if (!order || order.status === 'open') {
    return replyText(client, replyToken, '訂單尚未確認，還沒有收款資訊。');
  }

  const payments = db.getPayments(order.id);
  if (payments.length === 0) {
    return replyText(client, replyToken, '目前沒有收款記錄。');
  }

  const methodLabels = { cash: '現金', transfer: '轉帳', linepay: 'LINE Pay' };
  const lines = payments.map(p => {
    const method = methodLabels[p.method] || '未選擇';
    const status = p.paid ? '✅ 已付' : '❌ 未付';
    return `• ${p.user_name}｜${method}｜${status}`;
  });

  const paidCount = payments.filter(p => p.paid).length;
  lines.push(`\n已收：${paidCount}／${payments.length} 人`);

  return replyText(client, replyToken,
    `💰 收款狀態（${order.restaurant_name}）：\n\n${lines.join('\n')}`
  );
}

// ─── Cancel My Items ──────────────────────────────────────────────────────────

async function cancelMyItems(event, client) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  const order = db.getActiveOrder();
  if (!order || order.status !== 'open') {
    return replyText(client, replyToken, '目前沒有開放選餐的訂單。');
  }

  const removed = db.removeUserOrderItems(order.id, userId);
  if (!removed) {
    return replyText(client, replyToken, '你目前沒有選餐，無需取消。');
  }
  return replyText(client, replyToken, '✅ 已取消你的餐點選擇，可重新點選。');
}

// ─── Cancel Named User Items（主辦人用）────────────────────────────────────────

async function cancelNamedItems(event, client, name) {
  const replyToken = event.replyToken;

  const order = db.getActiveOrder();
  if (!order || order.status !== 'open') {
    return replyText(client, replyToken, '目前沒有開放選餐的訂單。');
  }

  const removed = db.removeNamedUserOrderItems(order.id, name);
  if (!removed) {
    const items = db.getOrderItems(order.id);
    const names = [...new Set(items.map(i => i.user_name))].join('、');
    return replyText(client, replyToken,
      `找不到「${name}」的選餐。\n目前有選餐的人：${names || '（無）'}`
    );
  }
  return replyText(client, replyToken, `✅ 已取消「${name}」的餐點選擇。`);
}

// ─── Cancel Order ─────────────────────────────────────────────────────────────

async function cancelOrder(event, client) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  const order = db.getActiveOrder();
  if (!order) {
    return replyText(client, replyToken, '目前沒有進行中的訂單。');
  }

  db.updateOrderStatus(order.id, 'closed');
  db.clearSession(userId);

  return replyText(client, replyToken,
    `❌ 訂單「${order.restaurant_name}」已取消。\n可以用 /新增訂單 重新建立。`
  );
}

module.exports = {
  createOrderSession,
  handleWizardInput,
  selectItem,
  viewTally,
  confirmOrder,
  setPaymentMethod,
  markMemberPaid,
  viewPaymentStatus,
  cancelOrder,
};
