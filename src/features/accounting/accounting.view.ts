import { TAccountingResponse, TTransaction } from "./accounting.schema";

function formatAmount(amount: number): string {
  return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatTransaction(tx: TTransaction): string {
  const sign = tx.type === "income" ? "+" : "−";
  return `  ${tx.date} | ${tx.category} | ${sign}${formatAmount(tx.amount)} грн`;
}

export function prettifyTransactions(data: TAccountingResponse): string {
  const lines = data.transactions.map(formatTransaction);

  return [
    "📋 Нові транзакції:",
    "",
    ...lines,
    "",
    "👍/❤️ — зберегти | 👎/💩 — відхилити",
  ].join("\n");
}

export const APPROVE_REACTIONS = new Set(["👍", "\u2764", "\u2764\uFE0F"]);
export const REJECT_REACTIONS = new Set(["👎", "💩"]);

export const prettyOnSaveSuccess = () => "✅ Збережено!";
export const prettyOnSaveFailure = () =>
  "❌ Упс, не сьогодні... Щось пішло не так\ncc @sgdtl";
export const prettyOnRejected = () => "🗑 Відхилено";
