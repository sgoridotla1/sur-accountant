import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  GPT_API_KEY: z.string(),
  GPT_MODEL_PARSE: z.string().default("gpt-5.2"),
  GPT_MODEL_NOISE: z.string().default("gpt-5.2"),
  PATH_TO_GOOGLE_KEYFILE: z.string(),
  GOOGLE_SHEET_ID: z.string(),
  SHEET_TABLE_INCOME: z.string(),
  SHEET_TABLE_EXPENSE: z.string(),
  ALLOWED_TOPIC_IDS: z
    .string()
    .optional()
    .transform((val) => val?.split(",").map(Number).filter(Boolean)),
});

export const config = envSchema.parse(process.env);
