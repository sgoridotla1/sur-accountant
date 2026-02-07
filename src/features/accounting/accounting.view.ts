import { TAccountingResponse } from "./accounting.schema";

function formatAmount(amount: number): string {
  return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function prettifyTransactions(data: TAccountingResponse): string {
  const lines = data.transactions.map((tx) => {
    const sign = tx.type === "income" ? "+" : "−";
    return `${tx.date}  ${sign}${formatAmount(tx.amount)} грн   ${tx.category}`;
  });

  return `Зберегти результат?\n\n${lines.join("\n")}`;
}

export const prettyOnSaveSuccess = () => "👍";
export const prettyOnSaveFailure = () =>
  "Упс, не сьогодні... Щось пішло не так\ncc @sgdtl";
export const prettyOnRejected = () => "🥴";
