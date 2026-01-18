import z from "zod";

// const incomeTransactionSchema = z.object({
//   date: z.string(),
//   type: z.literal("income"),
//   category: z.enum(["card", "cash", "other"]),
//   amount: z.number(),
// });

const expenseTransactionSchema = z.object({
  date: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  type: z.literal(["expense", "income"]),
  category: z.enum([
    "Закупка",
    "Таксі",
    "Обладнання",
    "Зарплата",
    "Прибирання",
    "Інше",
    "Картка",
    "Готівка",
  ]),
  amount: z.number(),
});

// export const accountingResponseSchema = z.object({
//   transactions: z.array(
//     z.discriminatedUnion("type", [
//       incomeTransactionSchema,
//       expenseTransactionSchema,
//     ]),
//   ),
// });

export const accountingResponseSchema = z.object({
  transactions: z.array(expenseTransactionSchema),
});

export type TAccountingResponse = z.infer<typeof accountingResponseSchema>;
export type TTransaction = TAccountingResponse["transactions"][number];
