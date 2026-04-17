'use strict';

const db = require('../db/queries');
const { buildMenuFlexMessage, buildPaymentNotificationMessage } = require('./messages');
const { isOrganizer } = require('./auth');

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

// ─── Context Hints ────────────────────────────────────────────────────────────

function hint(type, userId) {
  const org = isOrganizer(userId);
  if (type === 'wizard') {
    return '\n\n📌 接下來：\n' +
      '　繼續輸入 <品名> <價格> 新增品項\n' +
      '　/完成 → 結束菜單、發布點餐';
  }
  if (type === 'open') {
    return org
      ? '\n\n📌 可用指令：\n' +
        '　點選菜單按鈕 → 點餐（可多選）\n' +
        '　/統計 → 查看目前選餐\n' +
        '　/取消餐點 → 取消自己的選餐重選\n' +
        '　/取消餐點 <名字> → 取消他人選餐\n' +
        '　/確認下單 → 結單並通知付款\n' +
        '　/關閉訂單 → 關閉整筆訂單'
      : '\n\n📌 可用指令：\n' +
        '　點選菜單按鈕 → 點餐（可多選）\n' +
        '　/取消餐點 → 取消自己的選餐重選';
  }
  if (type === 'confirmed') {
    return org
      ? '\n\n📌 可用指令：\n' +
        '　/收款狀態 → 查看付款進度\n' +
        '　/關閉訂單 → 關閉訂單'
      : '\n\n📌 可用指令：\n' +
        '　付款通知按鈕 → 選擇付款方式';
  }
  if (type === 'none') {
    return '\n\n📌 可用指令：\n' +
      '　/新增訂單 <店名> → 開始新一輪訂餐';
  }
  return '';
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
  db.setSession(userId, 'setting_meal_label', { orderId, restaurantName: restaurant });

  return replyText(client, replyToken,
    `✅ 已建立「${restaurant}」訂單！\n\n請輸入這份訂單的餐點說明（例如：明天午餐、4/18 便當）\n若不需要，請輸入 /略過`
  );
}

// ─── Wizard: menu item entry ───────────────────────────────────────────────────

async function handleWizardInput(event, client, text, session) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;
  const { orderId, restaurantName } = session.data;

  // setting_meal_label state: collect optional meal label
  if (session.state === 'setting_meal_label') {
    if (text !== '/略過') {
      db.updateOrderMealLabel(orderId, text);
    }
    db.setSession(userId, 'setting_deadline', { orderId, restaurantName });
    return replyText(client, replyToken,
      `請輸入點餐截止時間（例如：4月18號中午12點）\n若無截止時間，請輸入 /略過`
    );
  }

  // setting_deadline state: collect optional order deadline
  if (session.state === 'setting_deadline') {
    if (text !== '/略過') {
      db.updateOrderDeadline(orderId, text);
    }
    db.setSession(userId, 'setting_threshold', { orderId, restaurantName });
    return replyText(client, replyToken,
      `請輸入外送標準金額（例如：500）\n若無外送標準，請輸入 /略過`
    );
  }

  // setting_threshold state: collect optional delivery threshold before menu entry
  if (session.state === 'setting_threshold') {
    if (text === '/略過' || text === '') {
      db.setSession(userId, 'adding_items', { orderId, restaurantName });
      return replyText(client, replyToken,
        `已略過外送標準。\n\n請一次輸入所有菜單品項，每行一個，格式：品名 金額\n範例：\n排骨飯 80\n雞腿飯 90`
      );
    }
    if (/^\d+$/.test(text)) {
      const value = parseInt(text, 10);
      db.setDeliveryThreshold(orderId, value);
      db.setSession(userId, 'adding_items', { orderId, restaurantName });
      return replyText(client, replyToken,
        `外送標準設為 $${value}。\n\n請一次輸入所有菜單品項，每行一個，格式：品名 金額\n範例：\n排骨飯 80\n雞腿飯 90`
      );
    }
    return replyText(client, replyToken, '請輸入純數字（例如：500），或輸入 /略過 跳過。');
  }

  // confirming_menu state: wait for /確認 or re-entry
  if (session.state === 'confirming_menu') {
    const { pendingItems } = session.data;

    if (text === '/確認') {
      for (const item of pendingItems) {
        db.addMenuItem(orderId, item.name, item.price);
      }
      db.clearSession(userId);
      const order = db.getActiveOrder();
      const menuItems = db.getMenuItems(orderId);
      const flexMsg = buildMenuFlexMessage(order, menuItems);
      return replyMessage(client, replyToken, flexMsg);
    }

    // Re-entry: parse as new batch
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed = [];
    const badLines = [];
    lines.forEach((line, i) => {
      const m = line.match(/^(.+?)\s+(\d+)$/);
      if (m) {
        parsed.push({ name: m[1].trim(), price: parseInt(m[2], 10) });
      } else {
        badLines.push(`第 ${i + 1} 行：${line}`);
      }
    });

    if (badLines.length > 0) {
      return replyText(client, replyToken,
        `以下行格式有誤，請重新輸入整份菜單：\n${badLines.join('\n')}\n\n格式：品名 金額，例如：排骨飯 80`
      );
    }

    db.setSession(userId, 'confirming_menu', { orderId, restaurantName, pendingItems: parsed });
    const preview = parsed.map(it => `${it.name} $${it.price}`).join('\n');
    return replyText(client, replyToken,
      `已解析以下品項：\n${preview}\n\n請確認以上菜單，輸入 /確認 建立，或重新輸入整份菜單。`
    );
  }

  // adding_items state: parse multi-line batch
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const parsed = [];
  const badLines = [];
  lines.forEach((line, i) => {
    const m = line.match(/^(.+?)\s+(\d+)$/);
    if (m) {
      parsed.push({ name: m[1].trim(), price: parseInt(m[2], 10) });
    } else {
      badLines.push(`第 ${i + 1} 行：${line}`);
    }
  });

  if (badLines.length > 0) {
    return replyText(client, replyToken,
      `以下行格式有誤，請重新輸入整份菜單：\n${badLines.join('\n')}\n\n格式：品名 金額，例如：排骨飯 80`
    );
  }

  if (parsed.length === 0) {
    return replyText(client, replyToken,
      '請輸入至少一道品項，格式：品名 金額，例如：排骨飯 80'
    );
  }

  db.setSession(userId, 'confirming_menu', { orderId, restaurantName, pendingItems: parsed });
  const preview = parsed.map(it => `${it.name} $${it.price}`).join('\n');
  return replyText(client, replyToken,
    `已解析以下品項：\n${preview}\n\n請確認以上菜單，輸入 /確認 建立，或重新輸入整份菜單。`
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

  await replyText(client, replyToken,
    `✅ 已加入：${item.name} $${item.price}\n${displayName} 目前：${myList}，共 $${myTotal}\n\n/取消餐點 → 取消自己的選餐重選`
  );

  // Re-push menu so it stays accessible at the bottom of the chat
  const sourceId = event.source.groupId || event.source.roomId || event.source.userId;
  return pushMessage(client, sourceId, buildMenuFlexMessage(order, menuItems));
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
      `📋 ${order.restaurant_name} — 目前沒有人選餐。` + hint('open', event.source.userId)
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

  if (order.delivery_threshold != null) {
    if (grandTotal >= order.delivery_threshold) {
      lines.push(`✅ 已達外送標準（$${order.delivery_threshold}）`);
    } else {
      const shortfall = order.delivery_threshold - grandTotal;
      lines.push(`⚠️ 距外送標準還差 $${shortfall}（標準：$${order.delivery_threshold}）`);
    }
  }

  return replyText(client, replyToken,
    `📋 ${order.restaurant_name} 目前訂單：\n\n${lines.join('\n')}`
  );
}

// ─── Confirm Order ────────────────────────────────────────────────────────────

async function confirmOrder(event, client) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;
  const order = db.getActiveOrder();

  if (!order || order.status !== 'open') {
    return replyText(client, replyToken, '目前沒有可確認的訂單。');
  }

  const items = db.getOrderItems(order.id);
  if (items.length === 0) {
    return replyText(client, replyToken, '還沒有人選餐，無法確認下單。');
  }

  db.updateOrderStatus(order.id, 'confirmed');

  // Auto-mark organizer as paid — they don't need to self-report
  const displayName = await getDisplayName(client, event);
  db.upsertPayment(order.id, userId, displayName, 'organizer');
  db.markPaidByUserId(order.id, userId);

  const uniqueUsers = new Set(items.map(i => i.user_id)).size;
  await replyText(client, replyToken,
    `✅ 訂單已確認！共 ${uniqueUsers} 人 ${items.length} 份，正在發送收款通知...\n\n請大家撥空付款，可現金、轉帳或 LINE Pay`
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
    return replyText(client, replyToken, '您已選擇付款方式，選擇後無法更改。');
  }

  const methodLabels = { cash: '現金', transfer: '轉帳', linepay: 'LINE Pay' };
  const label = methodLabels[method] || method;

  const displayName = await getDisplayName(client, event);

  db.upsertPayment(orderId, userId, displayName, method);
  db.markPaidByUserId(orderId, userId);

  return replyText(client, replyToken, `✅ 已記錄付款方式：${label}`);
}

// ─── View Payment Status ──────────────────────────────────────────────────────

async function viewPaymentStatus(event, client) {
  const replyToken = event.replyToken;
  const order = db.getActiveOrder();

  if (!order || order.status === 'open') {
    return replyText(client, replyToken, '訂單尚未確認，還沒有收款資訊。');
  }

  // Build unique orderers from order_items (dedup by user_id)
  const orderItems = db.getOrderItems(order.id);
  const orderersMap = {};
  for (const oi of orderItems) {
    if (!orderersMap[oi.user_id]) orderersMap[oi.user_id] = oi.user_name;
  }

  // Build payment lookup
  const payments = db.getPayments(order.id);
  const paymentByUserId = {};
  for (const p of payments) {
    paymentByUserId[p.user_id] = p;
  }

  const methodLabels = { cash: '現金', transfer: '轉帳', linepay: 'LINE Pay' };

  // Left-join: all orderers except organizer (method='organizer')
  const lines = [];
  let paidCount = 0;
  for (const [userId, userName] of Object.entries(orderersMap)) {
    const p = paymentByUserId[userId];
    if (p && p.method === 'organizer') continue; // exclude organizer
    if (p && p.paid) {
      const label = methodLabels[p.method] || p.method;
      lines.push(`• ${userName}｜${label}｜✅ 已付`);
      paidCount++;
    } else {
      lines.push(`• ${userName}｜未選擇｜未付`);
    }
  }

  if (lines.length === 0) {
    return replyText(client, replyToken, '目前沒有非主辦人的訂餐記錄。');
  }

  lines.push(`\n已付款 ${paidCount}／${lines.length} 人`);

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
  await replyText(client, replyToken, '✅ 已取消你的餐點選擇，可重新點選。');

  // Re-push menu so the member can immediately re-select
  const sourceId = event.source.groupId || event.source.roomId || event.source.userId;
  const menuItems = db.getMenuItems(order.id);
  return pushMessage(client, sourceId, buildMenuFlexMessage(order, menuItems));
}

// ─── Cancel Named User Items（主辦人用）────────────────────────────────────────

async function cancelNamedItems(event, client, name) {
  const replyToken = event.replyToken;
  const userId = event.source.userId;

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

// ─── Help ─────────────────────────────────────────────────────────────────────

function helpMessage(userId) {
  if (isOrganizer(userId)) {
    return '📋 可用指令\n\n' +
      '【訂餐管理】\n' +
      '/新增訂單 <店名> → 開始新一輪訂餐（主辦人）\n' +
      '/發布菜單 → 將菜單推送至群組（主辦人）\n' +
      '/統計 → 查看目前選餐（主辦人）\n' +
      '/確認下單 → 結單並發送付款通知（主辦人）\n' +
      '/關閉訂單 → 取消整筆訂單（主辦人）\n\n' +
      '【點餐】\n' +
      '點選菜單按鈕 → 點餐（可多選）\n' +
      '/取消餐點 → 取消自己的選餐重選\n' +
      '/取消餐點 <名字> → 取消他人選餐（主辦人）\n\n' +
      '【付款】\n' +
      '點選付款通知按鈕 → 回報付款方式（現金／轉帳／LINE Pay）\n' +
      '/收款狀態 → 查看付款進度（主辦人）\n\n' +
      '【其他】\n' +
      '/我的ID → 查看自己的 LINE ID\n' +
      '/help → 顯示本說明';
  }
  return '📋 可用指令\n\n' +
    '【點餐】\n' +
    '點選菜單按鈕 → 點餐（可多選）\n' +
    '/取消餐點 → 取消自己的選餐重選\n\n' +
    '【付款】\n' +
    '點選付款通知按鈕 → 回報付款方式（現金／轉帳／LINE Pay）\n\n' +
    '【其他】\n' +
    '/我的ID → 查看自己的 LINE ID\n' +
    '/help → 顯示本說明';
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
    `🔒 訂單「${order.restaurant_name}」已關閉。`
  );
}

// ─── Publish Menu to Group ────────────────────────────────────────────────────

async function publishMenu(event, client) {
  const replyToken = event.replyToken;
  const groupId = event.source.groupId;

  if (!groupId) {
    return replyText(client, replyToken, '此指令只能在群組中使用。');
  }

  const order = db.getActiveOrder();
  if (!order || order.status !== 'open') {
    return replyText(client, replyToken, '目前沒有開放中的訂單可以發布。');
  }

  const menuItems = db.getMenuItems(order.id);
  await pushMessage(client, groupId, buildMenuFlexMessage(order, menuItems));
  return replyText(client, replyToken, '✅ 菜單已發布至群組。');
}

module.exports = {
  createOrderSession,
  handleWizardInput,
  selectItem,
  viewTally,
  confirmOrder,
  setPaymentMethod,
  viewPaymentStatus,
  cancelMyItems,
  cancelNamedItems,
  cancelOrder,
  publishMenu,
  helpMessage,
};
