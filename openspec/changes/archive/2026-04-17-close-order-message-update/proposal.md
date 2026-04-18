## Summary

調整 `/關閉訂單` 指令的回覆訊息：將用詞從「已取消」改為「已關閉」、將 ❌ 改為更符合語義的圖示，並移除「可用指令」提示區塊。

## Motivation

- 「取消」（cancel）暗示訂單從未成立；「關閉」（close）更準確描述主辦人主動結束一筆進行中訂單的動作
- ❌ 通常代表錯誤或失敗，關閉訂單是主動操作，應使用語義更中性或正向的圖示
- 「可用指令」區塊在關閉訂單後已無操作意義（訂單已不存在），與已封存的 `remove-cancel-meal-hint` 提案一致，統一移除

## Proposed Solution

在 `src/bot/commands.js` 的 `cancelOrder` 函式，將回覆訊息由：

```
❌ 訂單「${order.restaurant_name}」已取消。 + hint(...)
```

改為：

```
🔒 訂單「${order.restaurant_name}」已關閉。
```

- `❌` 改為 `🔒`（鎖定符號，語義為「已關閉」）
- `已取消` 改為 `已關閉`
- 移除 `+ hint('none', userId)`

## Non-Goals

- 不修改資料庫欄位或訂單狀態值（仍為 `cancelled`）
- 不修改其他指令的回覆訊息
- 不修改 `/help` 中對 `/關閉訂單` 的描述文字

## Impact

- Affected specs: `line-bot-interface`
- Affected code:
  - `src/bot/commands.js`（`cancelOrder` 函式回覆訊息）
