'use strict';

const { URLSearchParams } = require('url');
const { getSession } = require('../db/queries');
const commands = require('./commands');

// Organizer whitelist from env — parsed once at startup
const ORGANIZER_IDS = new Set(
  (process.env.ORGANIZER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
);

function isOrganizer(userId) {
  // If whitelist is empty, allow everyone (facilitates first-time setup)
  if (ORGANIZER_IDS.size === 0) return true;
  return ORGANIZER_IDS.has(userId);
}

/**
 * Main event dispatcher.
 * Routes LINE events to the appropriate handler.
 */
async function handleEvent(event, client) {
  if (event.type === 'message' && event.message.type === 'text') {
    return handleTextMessage(event, client);
  }
  if (event.type === 'postback') {
    return handlePostback(event, client);
  }
  // Ignore all other event types
}

/**
 * Organizer Command Routing + wizard forwarding.
 * Prefix-matches text commands; forwards to wizard when session is active.
 */
async function handleTextMessage(event, client) {
  const text = event.message.text.trim();
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // /我的ID — available to everyone, replies privately with their userId
  if (text === '/我的ID') {
    return client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: `你的 LINE ID 是：\n${userId}` }],
    });
  }

  // Check for active wizard session first (organizer only)
  const session = getSession(userId);
  if (session && session.state === 'adding_items') {
    return commands.handleWizardInput(event, client, text, session);
  }

  // Organizer-only commands
  if (text.startsWith('/新增訂單') || text === '/統計' || text === '/確認下單' ||
      text.startsWith('/已收款') || text === '/收款狀態' || text === '/取消訂單') {
    if (!isOrganizer(userId)) {
      return client.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: '只有主辦人可以使用此指令。' }],
      });
    }
  }

  // LINE Bot 互動模式：指令 + postbackAction
  if (text.startsWith('/新增訂單')) {
    const restaurant = text.replace('/新增訂單', '').trim();
    return commands.createOrderSession(event, client, restaurant);
  }
  if (text === '/統計') {
    return commands.viewTally(event, client);
  }
  if (text === '/確認下單') {
    return commands.confirmOrder(event, client);
  }
  if (text.startsWith('/已收款')) {
    const name = text.replace('/已收款', '').trim();
    return commands.markMemberPaid(event, client, name);
  }
  if (text === '/收款狀態') {
    return commands.viewPaymentStatus(event, client);
  }
  if (text === '/取消訂單') {
    return commands.cancelOrder(event, client);
  }

  // Unrecognized message outside wizard — silently ignore
}

/**
 * Postback Event Handling.
 * Parses data as query string; dispatches by action field.
 */
async function handlePostback(event, client) {
  const params = new URLSearchParams(event.postback.data);
  const action = params.get('action');

  if (action === 'select_item') {
    const orderId = parseInt(params.get('order_id'), 10);
    const itemId = parseInt(params.get('item_id'), 10);
    return commands.selectItem(event, client, orderId, itemId);
  }

  if (action === 'set_payment') {
    const orderId = parseInt(params.get('order_id'), 10);
    const method = params.get('method');
    return commands.setPaymentMethod(event, client, orderId, method);
  }

  // Unknown action — silently ignore
}

module.exports = { handleEvent };
