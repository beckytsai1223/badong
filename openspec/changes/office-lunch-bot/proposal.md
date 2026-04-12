## Why

辦公室目前以 email 流程訂便當，主辦人須手動統計各人選項、追蹤收款狀態，繁瑣且容易出錯。本系統以 LINE Bot 取代整個流程，讓建菜單、選餐、統計、收款追蹤全部在 LINE 完成。

## What Changes

- 新增 LINE Bot webhook 服務，接收並處理群組訊息
- 主辦人可透過指令建立訂餐活動（含店名與菜單項目）
- Bot 自動發送 Flex Message 菜單，同事以 Quick Reply 按鈕選餐
- 系統自動統計各人訂單與金額，主辦人可隨時查詢
- 主辦人確認下單後，Bot 通知各人應付金額並收集付款方式
- 主辦人可逐一標記收款完成，並查詢整體收款狀態
- 使用 SQLite 本地資料庫儲存訂單、菜單、收款紀錄

## Non-Goals (optional)

- 不處理線上付款（轉帳、LINE Pay 的實際金流），僅記錄付款方式與狀態
- 不支援固定菜單或餐廳資料庫，每次由主辦人手動建立
- 不提供 Web 管理介面
- 不支援多個同時進行的訂餐活動（同一時間只有一個 active order）

## Capabilities

### New Capabilities

- `lunch-ordering`: 訂餐活動的完整生命週期——建立活動、收集選餐、統計彙整、確認下單
- `payment-tracking`: 收款追蹤——收集付款方式、標記已付款、查詢收款狀態
- `line-bot-interface`: LINE Bot 介面層——webhook 處理、Flex Message 菜單、Quick Reply 互動、主辦人指令解析

### Modified Capabilities

(none)

## Impact

- Affected specs: `lunch-ordering`, `payment-tracking`, `line-bot-interface`（全新）
- Affected code:
  - `src/index.js` — Express server + LINE webhook endpoint
  - `src/bot/handlers.js` — 訊息事件路由
  - `src/bot/commands.js` — 主辦人指令處理邏輯
  - `src/bot/messages.js` — Flex Message / Quick Reply 產生器
  - `src/db/schema.js` — SQLite 建表 SQL
  - `src/db/queries.js` — CRUD 操作
  - `package.json` — 依賴：`@line/bot-sdk`, `express`, `better-sqlite3`, `dotenv`
  - `.env` — `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`
