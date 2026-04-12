# 辦公室訂便當 LINE Bot

以 LINE Bot 取代 email 訂便當流程。主辦人建菜單、同事按按鈕選餐、系統自動統計並追蹤收款。

---

## 目錄

1. [前置需求](#前置需求)
2. [第一步：建立 LINE Bot 帳號](#第一步建立-line-bot-帳號)
3. [第二步：取得金鑰](#第二步取得金鑰)
4. [第三步：在本機啟動 Bot](#第三步在本機啟動-bot)
5. [第四步：用 ngrok 讓 LINE 連到你的電腦](#第四步用-ngrok-讓-line-連到你的電腦)
6. [第五步：設定 Webhook URL](#第五步設定-webhook-url)
7. [第六步：將 Bot 加入群組](#第六步將-bot-加入群組)
8. [正式部署（讓 Bot 24 小時運作）](#正式部署讓-bot-24-小時運作)
9. [使用方式](#使用方式)
10. [常見問題](#常見問題)

---

## 前置需求

- **Node.js v22.5 以上**（使用內建 `node:sqlite`，不需額外安裝資料庫）
  - 確認版本：`node -v`
  - 如果版本太舊，到 [nodejs.org](https://nodejs.org) 下載 LTS 版本
- **一個 LINE 帳號**（個人帳號即可，免費）
- **ngrok**（本地測試用，免費方案足夠）

---

## 第一步：建立 LINE Bot 帳號

LINE Bot 透過「Messaging API」運作。需要先到 LINE Developers Console 建立。

### 1-1. 登入 LINE Developers Console

前往 https://developers.line.biz/ → 右上角 **Log in** → 用你的 LINE 帳號登入。

### 1-2. 建立 Provider

> Provider 是你的開發者身份，可以想成一個「公司」或「組織」名稱。

1. 登入後點選 **Create a new provider**
2. 輸入任意名稱（例如：`我的辦公室` 或你的名字）
3. 點 **Create**

### 1-3. 建立 Messaging API Channel

> Channel 就是你的 Bot 帳號。

1. 在 Provider 頁面點 **Create a new channel**
2. 選擇 **Messaging API**
3. 填寫資料：
   - **Channel type**：Messaging API（已選）
   - **Provider**：剛才建立的 Provider
   - **Channel icon**：可跳過
   - **Channel name**：例如 `辦公室便當 Bot`（這會是 Bot 在 LINE 上顯示的名稱）
   - **Channel description**：例如 `辦公室訂便當機器人`
   - **Category / Subcategory**：選任意即可
   - **Email address**：填你的 email
4. 勾選同意條款 → 點 **Create**

---

## 第二步：取得金鑰

建立好 Channel 後，需要兩個金鑰：**Channel secret** 和 **Channel access token**。

### 2-1. 取得 Channel Secret

1. 在 Channel 設定頁面，點上方 **Basic settings** 頁籤
2. 往下捲，找到 **Channel secret**
3. 點 **Copy** 複製，貼到記事本備用

### 2-2. 取得 Channel Access Token

1. 點上方 **Messaging API** 頁籤
2. 往下捲，找到 **Channel access token (long-lived)**
3. 點 **Issue**（第一次使用）→ 確認 → 複製 token，貼到記事本備用

### 2-3. 調整 Bot 設定

在同一頁（Messaging API 頁籤）：

- **Auto-reply messages** → 點旁邊的 **Edit** → 關閉（改成 Disabled）
  - 若不關閉，Bot 會自動回覆制式訊息，干擾正常運作
- **Greeting messages** → 同樣關閉
- **Allow bot to join group chats** → 確認是開啟狀態（Enable）

---

## 第三步：在本機啟動 Bot

### 3-1. 下載並安裝依賴

```bash
cd 你的專案目錄
npm install
```

### 3-2. 建立 .env 設定檔

```bash
cp .env.example .env
```

用文字編輯器打開 `.env`，填入剛才複製的金鑰：

```
LINE_CHANNEL_SECRET=貼上你的_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=貼上你的_channel_access_token
PORT=3000
ORGANIZER_IDS=貼上主辦人的LINE_userId（多人用逗號分隔）
```

> **ORGANIZER_IDS 留空時，所有人都可以使用主辦人指令**（方便初次測試）。正式使用前請務必填入。

### 3-3. 如何查詢自己的 LINE userId

把 Bot 加入群組後，在群組輸入：

```
/我的ID
```

Bot 會回覆你的 userId（格式為 `U` 開頭的 33 字元字串），複製後貼到 `.env` 的 `ORGANIZER_IDS`。多位主辦人用逗號分隔：

```
ORGANIZER_IDS=U0080f5c93796fbb8bc,Uabc123def456
```

> `.env` 檔案包含敏感資訊，已加入 `.gitignore`，不會被 git 追蹤。

### 3-3. 啟動 Bot

```bash
npm start
```

看到以下訊息表示成功：

```
Office Lunch Bot listening on port 3000
```

這時 Bot 在你電腦的 `localhost:3000` 運行，但 LINE 伺服器在網路上，還無法連到你的電腦。下一步用 ngrok 解決。

---

## 第四步：用 ngrok 讓 LINE 連到你的電腦

> **ngrok** 是一個工具，可以建立一條安全的隧道，讓外部網路（LINE 伺服器）能連到你本機的 port 3000。

### 4-1. 安裝 ngrok

前往 https://ngrok.com/ → 免費註冊帳號 → 下載安裝。

**macOS（用 Homebrew）：**

```bash
brew install ngrok/ngrok/ngrok
```

**或直接下載：** 到 https://ngrok.com/download 下載 macOS 版本，解壓縮後移到 `/usr/local/bin/`。

安裝後設定 authtoken（只需做一次）：

1. 登入 ngrok 官網 → 左側選單 **Your Authtoken**
2. 複製 token
3. 執行：

```bash
ngrok config add-authtoken 你的_authtoken
```

### 4-2. 啟動 ngrok tunnel

**重要：Bot 必須先在執行中（`npm start`）。**

開啟新的終端機視窗，執行：

```bash
ngrok http 3000
```

成功後會看到類似畫面：

```
Session Status                online
Account                       你的帳號
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

複製 `https://` 開頭的網址（例如 `https://abc123.ngrok-free.app`），下一步需要用到。

> **注意**：免費版 ngrok 每次重啟 URL 會改變。每次重啟都要回 LINE Developers Console 更新 Webhook URL。

---

## 第五步：設定 Webhook URL

LINE 需要知道要把訊息送到哪個網址。

1. 回到 LINE Developers Console → 你的 Channel → **Messaging API** 頁籤
2. 找到 **Webhook URL** 欄位
3. 填入：`https://abc123.ngrok-free.app/webhook`（換成你的 ngrok 網址）
4. 點 **Update** 儲存
5. 點 **Verify** → 應該看到 **Success**
   - 如果失敗，確認 `npm start` 有在執行，ngrok 也有在執行
6. 確認 **Use webhook** 開關是開啟的（右側有個開關）

---

## 第六步：將 Bot 加入群組

1. 在 LINE Developers Console → Messaging API 頁籤，找到 **Bot basic information**
2. 掃描 **QR Code** 加 Bot 為好友
3. 在群組中點 **+** → 邀請 → 找到你的 Bot → 邀請進群組

加入成功後，在群組輸入 `/統計` 測試看看，Bot 應該會回覆「目前沒有進行中的訂單」。

---

## 正式部署（讓 Bot 24 小時運作）

本地測試沒問題後，可以部署到雲端讓 Bot 全天運作。推薦使用 **Railway**（免費額度足夠）。

### 方案 A：Railway（推薦，免費方案可用）

**Railway** 是一個簡單的雲端平台，支援直接從 GitHub 部署。

#### 前置：建立 GitHub 儲存庫

1. 前往 https://github.com → 建立新的 repository（private 即可）
2. 在專案目錄執行：

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/你的帳號/你的repo名稱.git
git push -u origin main
```

> 確認 `.gitignore` 有排除 `.env` 和 `*.db`，不要把金鑰推上去。

#### 部署到 Railway

1. 前往 https://railway.app → 用 GitHub 帳號登入
2. 點 **New Project** → **Deploy from GitHub repo**
3. 選擇你剛建立的 repository → **Deploy Now**
4. 等待部署完成（約 1-2 分鐘）

#### 設定環境變數

1. 在 Railway 專案頁面，點選你的服務
2. 點上方 **Variables** 頁籤
3. 點 **Add Variable**，逐一新增：

| Variable | Value |
|---|---|
| `LINE_CHANNEL_SECRET` | 你的 channel secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | 你的 channel access token |
| `PORT` | `3000` |

4. 儲存後 Railway 會自動重新部署

#### 取得部署網址

1. 點選 **Settings** 頁籤
2. 在 **Domains** 區塊點 **Generate Domain**
3. 複製產生的網址（例如 `https://office-lunch-bot.railway.app`）

#### 更新 LINE Webhook URL

回到 LINE Developers Console，把 Webhook URL 改為：
```
https://office-lunch-bot.railway.app/webhook
```

點 **Verify** 確認，這樣 Bot 就 24 小時上線了。

---

### 方案 B：Render（免費方案有 15 分鐘休眠限制）

Render 的免費方案在無流量時會休眠，第一次收到訊息會有約 30 秒延遲（喚醒時間），適合不介意這個限制的情境。

1. 前往 https://render.com → 用 GitHub 登入
2. **New** → **Web Service** → 選擇 repository
3. 設定：
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. 在 **Environment** 頁籤新增相同的環境變數
5. 部署完成後取得網址，更新 LINE Webhook URL

---

## 使用方式

### 主辦人指令

| 指令 | 說明 |
|------|------|
| `/新增訂單 <店名>` | 開始建立訂餐（進入菜單輸入模式） |
| `/統計` | 查看目前所有人的選餐與金額 |
| `/確認下單` | 鎖定訂單，發送收款通知給所有人 |
| `/已收款 <姓名>` | 標記某人已付款（姓名為 LINE 顯示名稱） |
| `/收款狀態` | 查看誰付了、誰還沒付 |

### 完整訂餐流程示範

**步驟 1 — 主辦人建立訂單**

```
主辦人：/新增訂單 老媽便當
Bot：✅ 已建立「老媽便當」訂單！請逐一輸入菜單項目...

主辦人：排骨飯 80
Bot：✓ 已加入：排骨飯 $80

主辦人：雞腿飯 90
Bot：✓ 已加入：雞腿飯 $90

主辦人：素食便當 75
Bot：✓ 已加入：素食便當 $75

主辦人：/完成
Bot：（發送菜單 Flex Message，含選餐按鈕）
```

**步驟 2 — 同事選餐**

同事點選 Quick Reply 按鈕（例如「雞腿飯 $90」），Bot 回覆確認。

**步驟 3 — 主辦人查看統計**

```
主辦人：/統計
Bot：📋 老媽便當 目前訂單：
     • 王小明：雞腿飯 $90
     • 李大華：排骨飯 $80
     • 張三：素食便當 $75
     合計：3 份，共 $245
```

**步驟 4 — 確認下單**

```
主辦人：/確認下單
Bot：✅ 訂單已確認！共 3 份，正在發送收款通知...
Bot：（發送收款通知，每人應付金額 + 付款方式按鈕）
```

**步驟 5 — 收款追蹤**

```
（同事點選付款方式按鈕）

主辦人：/已收款 王小明
Bot：✅ 已標記「王小明」收款完成。

主辦人：/收款狀態
Bot：💰 收款狀態（老媽便當）：
     • 王小明｜現金｜✅ 已付
     • 李大華｜轉帳｜❌ 未付
     • 張三｜LINE Pay｜❌ 未付
     已收：1／3 人
```

---

## 常見問題

**Q: Verify Webhook 一直失敗？**
- 確認 `npm start` 正在執行（沒有報錯）
- 確認 ngrok 正在執行
- Webhook URL 是否包含 `/webhook`（結尾不要有斜線）
- ngrok 免費版有連線數限制，嘗試重啟 ngrok

**Q: Bot 完全沒有回應？**
- 確認 **Use webhook** 開關是開啟的
- 確認 **Auto-reply messages** 是關閉的
- 查看 `npm start` 的終端機有沒有錯誤訊息

**Q: 在群組中 Bot 看不到訊息？**
- 確認在 LINE Developers Console 有開啟 **Allow bot to join group chats**
- 重新將 Bot 踢出群組再重新邀請

**Q: 每次重啟電腦都要重設 Webhook URL？**
- 是的，ngrok 免費版每次 URL 會改變。若要固定 URL，可以付費升級 ngrok，或直接部署到 Railway/Render。

**Q: 資料會不見嗎？**
- 本地開發：資料存在 `lunch.db`，重啟 Bot 不影響資料，但刪除 `lunch.db` 資料就消失。
- Railway/Render：每次重新部署會清除資料（免費方案沒有持久化儲存）。若需要保留歷史記錄，可考慮升級至付費方案並掛載 Volume。

---

## 資料儲存

使用 Node.js 內建 `node:sqlite`（v22.5+ 實驗性功能，功能穩定），資料存於 `lunch.db`（已加入 `.gitignore`）。
