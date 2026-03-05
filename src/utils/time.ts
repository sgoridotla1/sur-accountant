import { tool } from "@langchain/core/tools";
import z from "zod";

export function formatTelegramDate(date: number) {
  return new Intl.DateTimeFormat("en-GB").format(date * 1000);
}

export const getTodayDate = tool(
  () => new Date().toISOString().split("T")[0],
  {
    name: "get_today_date",
    description:
      "Returns today's date in YYYY-MM-DD format. Use this when no date is present in the message.",
    schema: z.object({}),
  },
);
