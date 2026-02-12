import { TAccountingResponse, TTransaction } from "./accounting.schema";

function formatAmount(amount: number): string {
  return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function padEnd(str: string, width: number): string {
  const len = [...str].length;
  return str + " ".repeat(Math.max(0, width - len));
}

function padStart(str: string, width: number): string {
  const len = [...str].length;
  return " ".repeat(Math.max(0, width - len)) + str;
}

export function prettifyTransactions(data: TAccountingResponse): string {
  const txs = data.transactions;

  const amounts = txs.map((tx) => {
    const sign = tx.type === "income" ? "+" : "−";
    return `${sign}${formatAmount(tx.amount)} грн`;
  });

  const maxAmountLen = Math.max(...amounts.map((a) => [...a].length));
  const maxCategoryLen = Math.max(...txs.map((tx) => [...tx.category].length));

  const lines = txs.map((tx, i) => {
    const amount = padStart(amounts[i], maxAmountLen);
    const category = padEnd(tx.category, maxCategoryLen);
    return `${tx.date}  ${amount}   ${category}`;
  });

  return [
    "```",
    ...lines,
    "```",
    "",
    "👍/❤️ — зберегти | 👎/💩 — відхилити",
  ].join("\n");
}

export const APPROVE_REACTIONS = new Set(["👍", "\u2764", "\u2764\uFE0F"]);
export const REJECT_REACTIONS = new Set(["👎", "💩"]);

export const prettyOnSaveSuccess = () => "🙂 Збережено!";
export const prettyOnSaveFailure = () =>
  "😩 Упс, не сьогодні... Щось пішло не так\ncc @sgdtl";
export const prettyOnRejected = () => "😓 Відхилено";
