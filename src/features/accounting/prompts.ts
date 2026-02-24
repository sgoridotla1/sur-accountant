import fs from "fs";
import path from "path";
import { AIMessage, HumanMessage } from "langchain";

export type TExample = {
  input: string;
  output: {
    transactions: {
      date: string;
      type: string;
      category: string;
      amount: number;
    }[];
  };
};

type TPromptOptions = {
  date: string;
};

function loadExamples(filename: string): TExample[] {
  const filePath = path.join(process.cwd(), "data", filename);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function buildFewShotMessages(
  examples: TExample[],
): Array<HumanMessage | AIMessage> {
  return examples.flatMap((ex) => [
    new HumanMessage(ex.input),
    new AIMessage(JSON.stringify(ex.output)),
  ]);
}

export const textExamples = loadExamples("text-examples.jsonl");
export const imageExamples = loadExamples("image-examples.jsonl");

export const noiseDetectionPrompt = `You are a binary classifier for a Ukrainian small-business accounting Telegram bot.

TASK: Decide whether a message contains at least one financial transaction. Return isNoise = false if it does, isNoise = true otherwise.

A TRANSACTION message contains BOTH:
1. A monetary amount (number representing money spent or received)
2. Context indicating a purchase, payment, income, or expense — such as a store name, category, or payment method

Examples of TRANSACTION messages (isNoise = false):
- "Сільпо 450 картка"
- "готівка 1200"
- "28.12\\nновус 320\\nприбирання 500"
- "зарплата 15000"
- "купили блендер 2800"
- "Убер 250"

Examples of NOISE messages (isNoise = true):
- "Зустрінемося о 15:00" (time, not money)
- "вул. Шевченка 23" (address)
- "Зателефонуй 0501234567" (phone number)
- "Замовлення #12345 підтверджено" (order ID, not a payment)
- "Привіт, як справи?" (conversation)
- "3 кг яблук" (quantity, not a monetary amount)
- "Рейтинг 4.5 з 5" (rating)

RULES:
- Numbers alone do NOT make a transaction — they must represent money
- Phone numbers, addresses, dates, times, order IDs, quantities, and ratings are NOT transactions
- When uncertain, lean towards isNoise = false (let the parser decide)`;

export const imageParserPrompt = (options: TPromptOptions) => `
You are an OCR extraction engine for Ukrainian receipts.

TASK:
Extract ONLY:
1) the receipt GRAND TOTAL (final amount to pay)
2) the receipt DATE

DO NOT extract line items, VAT, subtotals, or payment details.

──────────────── DATE RULES ────────────────
- Look for a receipt date in formats such as:
  "DD.MM.YYYY", "DD.MM.YY", "DD.MM", "YYYY-MM-DD"
- Ukrainian date keywords may include:
  "Дата", "Дата чеку", "Чек", "Чек №", "Фіскальний чек"
- If time is present, ignore it.
- If year is missing, assume the current year.
- Output date in ISO format: YYYY-MM-DD.
- If NO date is found anywhere in the message, use today's date: ${options.date}.

──────────────── TOTAL RULES ────────────────
- Extract ONLY the GRAND TOTAL (final payable amount).
- Prefer labels in this priority order:
  1) "До сплати"
  2) "Всього" / "Усього"
  3) "Разом"
  4) "Сума"
  5) "TOTAL" / "TOTAL AMOUNT"

- Ignore amounts related to:
  - subtotal ("Проміжний підсумок")
  - discounts ("Знижка")
  - VAT ("ПДВ")
  - change ("Решта")
  - cash given / card charge lines
  - tips, bonuses, loyalty points

- If multiple total-like values exist, choose the one that clearly represents the FINAL amount to pay.
- Convert comma decimals to dot decimals.
- If currency is missing, assume UAH.

──────────────── OCR NOISE ────────────────
- Treat common OCR mixups between Cyrillic and Latin letters as equivalent
  (e.g., "Bсього", "Pазом", "Do cплати").
- Ignore decorative text, separators, and logos.

──────────────── CATEGORY RULES ────────────────
- Determine category from the merchant/store name visible on the receipt.
- Use EXACTLY one of these values:
  - "Закупка"    — groceries, food, supplies (Сільпо, Novus, okwine, ТС, ТС+, АТБ, Фора, etc.)
  - "Таксі"      — taxi, ride services (Uber, Bolt, Uklon, etc.)
  - "Обладнання" — equipment, tools, hardware (Епіцентр, Comfy, etc.)
  - "Зарплата"   — salary, wages, payroll
  - "Прибирання" — cleaning services
  - "Інше"       — anything that doesn't fit above
- Default type is "expense".

──────────────── NON-RECEIPT IMAGES ────────────────
- If the image is NOT a receipt or does NOT contain any accounting data,
  return: { "transactions": [] }
- Do NOT hallucinate or invent transactions from non-receipt images
  (photos, memes, screenshots, documents, etc.).
`;

export const textParsePrompt = (options: TPromptOptions) => `
You are a text extraction engine for short Ukrainian accounting messages written by employees.

TASK:
Extract ALL accounting transactions from the text.
Each transaction must include:
- date
- type (income or expense)
- category
- amount

DO NOT infer VAT, subtotals, balances, or totals unless explicitly written as a transaction.

──────────────── DATE RULES ────────────────
- Look for dates in formats such as:
  "DD.MM.YYYY", "DD.MM.YY", "DD.MM", "YYYY-MM-DD"
- A line containing only a date (e.g. "28.12") sets the current date context
  for all following transactions until another date appears.
- If a date does NOT include a year, assume the current year.
- Output all dates in ISO format: YYYY-MM-DD.
- If NO date is found anywhere in the message, use today's date: ${options.date}.

──────────────── TRANSACTION RULES ────────────────
- Each transaction must be extracted from a line that contains a number.
- Extract the number from the line which represents the transaction amount.
- Amount rules:
  - Remove spaces used as thousand separators ("1 510" → 1510).
  - Convert comma decimals to dot decimals ("123,45" → 123.45).
  - Amount must be a number.

──────────────── TYPE RULES ────────────────
- Default type is "expense".
- If the line is under a section header such as:
  "Витрати:", "Витрата:", "Expenses:"
  then type = "expense" for all following lines until the section ends.
- Also treat lines containing keywords as:
  - income: "дохід", "income", "картка", "готівка", "приват", "моно"
  - expense: "витрата", "витрати", "expense"

──────────────── CATEGORY RULES ────────────────
- Category is the remaining text after removing:
  - the amount
  - payment method words
- Payment method words to REMOVE from category:
  "карта", "карткою", "card", "безготівка", "готівка", "cash"
- Trim and normalize category text.
- If category becomes empty:
  - income → "income"
  - expense → "expense"
- If contains words like  "Гот" or "готівка", put "Готівка" "картка",  "приват", "моно" put "Картка"
- If contains words like Сільпо, okwine, оквайн, новус, novus, тс, тс+ put "Закупка"
- If unsure about category put "Інше" (other)

──────────────── NOISE HANDLING ────────────────
- Ignore empty lines, emojis, separators, and comments.
- Ignore lines that do NOT contain a numeric amount.
- Do NOT invent or merge transactions.
    `;
