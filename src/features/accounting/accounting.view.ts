import { TAccountingResponse, TTransaction } from "./accounting.schema";

function formatDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}.${month}`;
}

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

  // Group transactions by date, preserving first-occurrence order
  const grouped = new Map<string, number[]>();
  txs.forEach((tx, i) => {
    const indices = grouped.get(tx.date);
    if (indices) {
      indices.push(i);
    } else {
      grouped.set(tx.date, [i]);
    }
  });

  const groups = [...grouped.entries()].map(([date, indices]) => {
    const lines = indices.map((i) => {
      const amount = padEnd(amounts[i], maxAmountLen);
      const category = txs[i].category;
      return `${amount}   ${category}`;
    });
    return [`<b>${formatDate(date)}</b>`, "—", ...lines].join("\n");
  });

  return [
    groups.join("\n\n"),
    "",
    "👍/❤️ — зберегти | 👎/💩 — відхилити",
  ].join("\n");
}

export const APPROVE_REACTIONS = new Set(["👍", "\u2764", "\u2764\uFE0F"]);
export const REJECT_REACTIONS = new Set(["👎", "💩"]);

