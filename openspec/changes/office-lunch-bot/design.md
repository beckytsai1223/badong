## Context

辦公室（約 10 人）用 email 流程訂便當，主辦人手動統計且追蹤收款費力。本設計以 LINE Messaging API 建構一個 Webhook Bot，運行在 Node.js + Express 上，資料儲存至本地 SQLite。全新專案，無既有程式碼需遷移。

關鍵約束：
- 同一時間只有一個 active 訂餐活動
- 不處理任何金流，僅記錄付款方式與狀態
- 部署目標需支援 HTTPS（LINE Webhook 要求）

## Goals / Non-Goals

**Goals:**

- 以 LINE Bot 完整取代 email 訂便當流程
- 主辦人透過文字指令控制訂餐生命週期
- 同事透過 Flex Message + Quick Reply 按鈕選餐，無須打字
- 自動統計訂單與金額
- 追蹤每人付款方式與狀態

**Non-Goals:**

- 不整合線上付款（轉帳、LINE Pay 金流）
- 不支援固定餐廳資料庫或歷史菜單
- 不提供 Web 管理後台
- 不支援同時多個訂餐活動

## Decisions

### LINE Bot 互動模式：指令 + postbackAction

主辦人使用文字指令（`/新增訂單`、`/統計`、`/確認下單`、`/已收款`、`/收款狀態`），同事使用 Flex Message 的 `postbackAction` 按鈕回傳選擇，不依賴文字解析。

**Alternatives considered:**
- 純文字解析（NLP）→ 脆弱且維護成本高，不採用
- LIFF（LINE 內嵌 Web App）→ 需額外前端開發，10 人規模不值得，不採用

**Rationale**: postbackAction 提供結構化資料（`action=select&item_id=1`），比文字解析可靠，且 Flex Message 視覺效果足夠清晰。

### 資料儲存：SQLite（better-sqlite3）

**Alternatives considered:**
- In-memory（Map/object）→ 重啟資料遺失，不採用
- PostgreSQL / MySQL → 10 人規模殺雞用牛刀，部署複雜度提高，不採用

**Rationale**: SQLite 單檔案、零配置、同步 API（`better-sqlite3`）避免 async 複雜度，對此規模綽綽有餘。

### 訂單狀態機

```
open → confirmed → closed
```

- `open`：接受選餐中
- `confirmed`：主辦人已確認下單，開始收款
- `closed`：收款完畢（可選，手動關閉）

狀態轉換由主辦人指令觸發：
- `/確認下單` → `open` → `confirmed`
- 僅 `open` 狀態可接受選餐變更

### Postback 資料格式

```
action=select_item&order_id=1&item_id=2
action=set_payment&order_id=1&method=cash
```

使用 query string 格式，方便解析，每個 action 攜帶完整 context 避免 session 狀態。

### 菜單建立流程：多輪對話（conversational wizard）

主辦人輸入 `/新增訂單 老媽便當` 後，Bot 進入引導式多輪對話收集菜單項目（每次輸入一個品項，空行結束）。以 `db` 中的 `session` table 追蹤對話狀態。

**Alternatives considered:**
- 一次性格式（e.g., `/新增訂單 老媽便當 排骨飯:80 雞腿飯:90`）→ 格式複雜，使用者容易輸入錯誤，不採用

## Risks / Trade-offs

- **LINE Webhook 簽章驗證**：必須驗證 `X-Line-Signature`，否則任何人可偽造訊息。→ 使用 `@line/bot-sdk` 內建的 middleware 處理
- **Concurrent postback**：多人同時按選餐按鈕，SQLite 同步寫入可能競爭。→ `better-sqlite3` 使用同步 API，Node.js 單執行緒，不會有競態條件
- **Bot 只能辨識群組中的指令**：若主辦人在私訊中操作，需確認 Bot 有一對一聊天權限。→ 文件說明部署時需開啟 1-on-1 chat 或限定只在群組中使用
- **無認證機制**：任何人都可以輸入主辦人指令。→ MVP 接受此限制；可日後加入「白名單 userId」保護
