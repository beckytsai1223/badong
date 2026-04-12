'use strict';

const { URLSearchParams } = require('url');
const { getSession } = require('../db/queries');
const commands = require('./commands');

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

  // Check for active wizard session first
  const session = getSession(userId);
  if (session && session.state === 'adding_items') {
    return commands.handleWizardInput(event, client, text, session);
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
