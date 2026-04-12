'use strict';

const { getDb } = require('./schema');

// ─── Order ────────────────────────────────────────────────────────────────────

function createOrder(restaurantName, createdBy) {
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO orders (restaurant_name, status, created_by) VALUES (?, 'open', ?)`
  ).run(restaurantName, createdBy);
  return result.lastInsertRowid;
}

function getActiveOrder() {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM orders WHERE status IN ('open', 'confirmed') ORDER BY id DESC LIMIT 1`
  ).get();
}

function updateOrderStatus(orderId, status) {
  const db = getDb();
  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, orderId);
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────

function addMenuItem(orderId, name, price) {
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO menu_items (order_id, name, price) VALUES (?, ?, ?)`
  ).run(orderId, name, price);
  return result.lastInsertRowid;
}

function getMenuItems(orderId) {
  const db = getDb();
  return db.prepare(`SELECT * FROM menu_items WHERE order_id = ?`).all(orderId);
}

// ─── OrderItem ────────────────────────────────────────────────────────────────

function upsertOrderItem(orderId, userId, userName, menuItemId) {
  const db = getDb();
  db.prepare(`
    INSERT INTO order_items (order_id, user_id, user_name, menu_item_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(order_id, user_id) DO UPDATE SET
      user_name = excluded.user_name,
      menu_item_id = excluded.menu_item_id
  `).run(orderId, userId, userName, menuItemId);
}

function getOrderItems(orderId) {
  const db = getDb();
  return db.prepare(`
    SELECT oi.user_id, oi.user_name, mi.name AS item_name, mi.price, mi.id AS menu_item_id
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = ?
    ORDER BY oi.id
  `).all(orderId);
}

// ─── Payment ──────────────────────────────────────────────────────────────────

function upsertPayment(orderId, userId, userName, method) {
  const db = getDb();
  db.prepare(`
    INSERT INTO payments (order_id, user_id, user_name, method, paid)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(order_id, user_id) DO UPDATE SET
      method = excluded.method
  `).run(orderId, userId, userName, method);
}

function getPayments(orderId) {
  const db = getDb();
  return db.prepare(`SELECT * FROM payments WHERE order_id = ? ORDER BY id`).all(orderId);
}

function markPaid(orderId, userName) {
  const db = getDb();
  const result = db.prepare(`
    UPDATE payments SET paid = 1
    WHERE order_id = ? AND lower(user_name) = lower(?)
  `).run(orderId, userName);
  return result.changes > 0;
}

// ─── Session ──────────────────────────────────────────────────────────────────

function setSession(userId, state, data) {
  const db = getDb();
  db.prepare(`
    INSERT INTO sessions (user_id, state, data, updated_at)
    VALUES (?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(user_id) DO UPDATE SET
      state = excluded.state,
      data = excluded.data,
      updated_at = excluded.updated_at
  `).run(userId, state, JSON.stringify(data));
}

function getSession(userId) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM sessions WHERE user_id = ?`).get(userId);
  if (!row) return null;
  return { state: row.state, data: JSON.parse(row.data) };
}

function clearSession(userId) {
  const db = getDb();
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

module.exports = {
  createOrder, getActiveOrder, updateOrderStatus,
  addMenuItem, getMenuItems,
  upsertOrderItem, getOrderItems,
  upsertPayment, getPayments, markPaid,
  setSession, getSession, clearSession,
};
