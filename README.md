# 辦公室訂便當 LINE Bot

以 LINE Bot 取代 email 訂便當流程。主辦人建立菜單、同事按按鈕選餐、系統自動統計並追蹤收款。

---

## 目錄

1. [前置需求](#前置需求)
2. [第一步：建立 LINE Bot 帳號](#第一步建立-line-bot-帳號)
3. [第二步：取得金鑰](#第二步取得金鑰)
4. [第三步：在本機啟動 Bot](#第三步在本機啟動-bot)
5. [第四步：用 ngrok 讓 LINE 連到你的電腦](#第四步用-ngrok-讓-line-連到你的電腦)
6. [第五步：設定 Webhook URL](#第五步設定-webhook-url)
7. [第六步：將 Bot 加入群組](#第六步將-bot-加入群組)
8. [正式部署（Render）](#正式部署render)
9. [防止休眠（UptimeRobot）](#防止休眠uptimerobot)
10. [使用方式](#使用方式)
11. [常見問題](#常見問題)

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
   - **Channel name**：例如 `辦公室便當 Bot`
   - **Channel description**：例如 `辦公室訂便當機器人`
   - **Category / Subcategory**：選任意即可
   - **Email address**：填你的 email
4. 勾選同意條款 → 點 **Create**

---

## 第二步：取得金鑰

建立好 Channel 後，需要兩個金鑰：**Channel secret** 和 **Channel access token**。

### 2-1. 取得 Channel Secret

1. Channel 設定頁面 → **Basic settings** 頁籤
2. 找到 **Channel secret** → 點 **Copy** 複製備用

### 2-2. 取得 Channel Access Token

1. **Messaging API** 頁籤
2. 找到 **Channel access token (long-lived)** → 點 **Issue** → 複製備用

### 2-3. 調整 Bot 設定

在 **Messaging API** 頁籤：

- **Auto-reply messages** → 點 **Edit** → 關閉（Disabled）
- **Greeting messages** → 同樣關閉
- **Allow bot to join group chats** → 確認開啟（Enabled）

---

## 第三步：在本機啟動 Bot

### 3-1. 安裝依賴

```bash
npm install
```

### 3-2. 建立 .env 設定檔

```bash
cp .env.example .env
```

用文字編輯器打開 `.env`，填入金鑰：

```
LINE_CHANNEL_SECRET=貼上你的_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=貼上你的_channel_access_token
PORT=3000
ORGANIZER_IDS=貼上主辦人的LINE_userId（多人用逗號分隔）
```

> **ORGANIZER_IDS 留空時，所有人都可以使用主辦人指令**（方便初次測試）。正式使用前請填入。

### 3-3. 查詢自己的 LINE userId

把 Bot 加入群組後，在群組輸入 `/我的ID`，Bot 會回覆你的 userId（`U` 開頭的 33 字元字串）。

```
ORGANIZER_IDS=U0080f5c93796fbb8bc,Uabc123def456
```

### 3-4. 啟動 Bot

```bash
npm start
```

看到以下訊息表示成功：

```
Office Lunch Bot listening on port 3000
```

---

## 第四步：用 ngrok 讓 LINE 連到你的電腦

### 4-1. 安裝 ngrok

前往 https://ngrok.com/ 免費註冊，下載安裝後設定 authtoken：

```bash
ngrok config add-authtoken 你的_authtoken
```

### 4-2. 啟動 tunnel

```bash
ngrok http 3000
```

複製輸出中 `https://` 開頭的網址（例如 `https://abc123.ngrok-free.app`）。

> 免費版 ngrok 每次重啟 URL 會改變，需重新設定 Webhook URL。

---

## 第五步：設定 Webhook URL

1. LINE Developers Console → Channel → **Messaging API** 頁籤
2. **Webhook URL** 填入：`https://abc123.ngrok-free.app/webhook`
3. 點 **Update** → 點 **Verify** → 確認顯示 **Success**
4. 確認 **Use webhook** 開關是開啟的

---

## 第六步：將 Bot 加入群組

1. LINE Developers Console → Messaging API → 掃描 **QR Code** 加 Bot 為好友
2. 在群組中邀請 Bot 加入
3. 群組輸入 `/統計` 測試，Bot 應回覆「目前沒有進行中的訂單」

---

## 正式部署（Render）

本地測試沒問題後，部署到 Render 讓 Bot 全天運作。

### 前置：推送到 GitHub

確認 `.gitignore` 已排除 `.env` 和 `*.db`，再推上 GitHub：

```bash
git push origin main
```

### 部署步驟

1. 前往 https://render.com → 用 GitHub 帳號登入
2. **New** → **Web Service** → 選擇你的 repository
3. 設定：
   - **Build Command**：`npm install`
   - **Start Command**：`npm start`
   - **Plan**：Free
4. 在 **Environment** 頁籤新增環境變數：

| Variable | Value |
|---|---|
| `LINE_CHANNEL_SECRET` | 你的 channel secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | 你的 channel access token |
| `ORGANIZER_IDS` | 主辦人的 LINE userId |

5. 部署完成後取得網址（例如 `https://your-app.onrender.com`）
6. 回到 LINE Developers Console，將 Webhook URL 更新為：
   ```
   https://your-app.onrender.com/webhook
   ```

---

## 防止休眠（UptimeRobot）

Render 免費方案在 15 分鐘無流量時會自動休眠，需要 UptimeRobot 定期 ping 保持服務運作。

1. 前往 https://uptimerobot.com 免費註冊
2. 點 **+ Add New Monitor**，填入：
   - **Monitor Type**：`HTTP(s)`
   - **Friendly Name**：任意（例如 `Badong Bot`）
   - **URL**：`https://your-app.onrender.com/health`
   - **Monitoring Interval**：`5 minutes`
3. 點 **Create Monitor**

設定完成後，UptimeRobot 每 5 分鐘自動 ping 一次，服務不再休眠。

---

## 使用方式

### 主辦人指令

| 指令 | 說明 |
|------|------|
| `/新增訂單 <店名>` | 開始建立新訂單（進入設定流程） |
| `/發布菜單` | 將已建立的菜單重新推送至群組 |
| `/統計` | 查看目前所有人的選餐與金額 |
| `/確認下單` | 鎖定訂單，發送收款通知 |
| `/收款狀態` | 查看誰已付款、誰尚未付款 |
| `/關閉訂單` | 關閉整筆訂單（任何流程階段均可使用） |
| `/取消餐點 <名字>` | 取消指定同事的選餐 |

### 一般同事指令

| 指令 | 說明 |
|------|------|
| 點選菜單按鈕 | 點餐（可多選） |
| `/取消餐點` | 取消自己的選餐並重選 |
| 點選付款通知按鈕 | 回報付款方式（現金／轉帳／LINE Pay） |
| `/我的ID` | 查看自己的 LINE userId |
| `/help` | 顯示可用指令說明 |

---

### 完整訂餐流程示範

**步驟 1 — 主辦人建立訂單**

主辦人輸入 `/新增訂單 老媽便當`，Bot 依序詢問：

```
Bot：✅ 已建立「老媽便當」訂單！

     請輸入這份訂單的餐點說明（例如：明天午餐、4/18 便當）
     若不需要，請輸入 /略過

主辦人：明天午餐

Bot：請輸入點餐截止時間（例如：4月18號中午12點）
     若無截止時間，請輸入 /略過

主辦人：今天中午11點半

Bot：請輸入外送標準金額（例如：500）
     若無外送標準，請輸入 /略過

主辦人：500

Bot：外送標準設為 $500。

     請一次輸入所有菜單品項，每行一個，格式：品名 金額
     範例：
     排骨飯 80
     雞腿飯 90

主辦人：排骨飯 80
        雞腿飯 90
        素食便當 75

Bot：已解析以下品項：
     排骨飯 $80
     雞腿飯 $90
     素食便當 $75

     請確認以上菜單，輸入 /確認 建立，或重新輸入整份菜單。

主辦人：/確認

Bot：（發送菜單 Flex Message 至群組，header 顯示「🍱 老媽便當｜明天午餐」）
```

> 主辦人如果是在私聊建立訂單，可再輸入 `/發布菜單` 將菜單推送至群組。

**步驟 2 — 同事選餐**

同事點選 Flex Message 中的「點選」按鈕即可選餐，可多選。

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
Bot：（發送收款通知 Flex Message，每人看到自己的品項與金額，
      底部有「已完成現金付款」「已完成轉帳付款」「已完成 LINE Pay 付款」按鈕）
```

**步驟 5 — 同事回報付款**

同事點選付款按鈕，Bot 記錄付款方式。

**步驟 6 — 主辦人查看收款狀態**

```
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
- Webhook URL 結尾必須是 `/webhook`，不要有多餘斜線
- 嘗試重啟 ngrok

**Q: Bot 完全沒有回應？**
- 確認 **Use webhook** 開關是開啟的
- 確認 **Auto-reply messages** 是關閉的
- 查看終端機有沒有錯誤訊息

**Q: 在群組中 Bot 看不到訊息？**
- 確認已開啟 **Allow bot to join group chats**
- 嘗試將 Bot 踢出群組再重新邀請

**Q: 部署到 Render 後 Bot 回應很慢或沒反應？**
- 免費方案 15 分鐘無流量會休眠，請依照[防止休眠](#防止休眠uptimerobot)章節設定 UptimeRobot。

**Q: 資料會不見嗎？**
- 本地開發：資料存於 `lunch.db`，重啟不影響，但刪除檔案資料就消失。
- Render 免費方案：每次重新部署會清除資料（無持久化儲存）。

---

## 資料儲存

使用 Node.js 內建 `node:sqlite`（v22.5+），資料存於 `lunch.db`（已加入 `.gitignore`）。`orders` 表包含 `meal_label`、`order_deadline`、`delivery_threshold` 等欄位，均在首次啟動時自動建立與 migration。
