import { TAccountingResponse, TTransaction } from "./accounting.schema";

function formatAmount(amount: number): string {
  return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatTransaction(tx: TTransaction): string {
  const sign = tx.type === "income" ? "+" : "−";
  return `  ${tx.date} | ${tx.category} | ${sign}${formatAmount(tx.amount)} грн`;
}

function formatTotal(transactions: TTransaction[]): string {
  const total = transactions.reduce((sum, tx) => {
    return tx.type === "income" ? sum + tx.amount : sum - tx.amount;
  }, 0);

  const sign = total >= 0 ? "+" : "−";
  return `${sign}${formatAmount(Math.abs(total))} грн`;
}

export function prettifyTransactions(data: TAccountingResponse): string {
  const lines = data.transactions.map(formatTransaction);
  const total = formatTotal(data.transactions);

  return [
    "📋 Нові транзакції:",
    "",
    ...lines,
    "",
    `💰 Разом: ${total}`,
    "",
    "👍/❤️ — зберегти | 👎/💩 — відхилити",
  ].join("\n");
}

export const APPROVE_REACTIONS = new Set(["👍", "❤️"]);
export const REJECT_REACTIONS = new Set(["👎", "💩"]);

export const prettyOnSaveSuccess = () => "✅ Збережено!";
export const prettyOnSaveFailure = () =>
  "❌ Упс, не сьогодні... Щось пішло не так\ncc @sgdtl";
export const prettyOnRejected = () => "🗑 Відхилено";
