import express from "express";

import "dotenv/config";
import z from "zod";

import TelegramClient from "./clients/telegram";
import Agent from "./clients/agent";
import GoogleSheetsClient from "./clients/google-sheets";

import { AccountingService, accountingResponseSchema } from "./features/accounting";
import { logger } from "./utils/logger";

const app = express();
const port = 3000;

async function main() {
  const bot = new TelegramClient(process.env.TELEGRAM_BOT_TOKEN as string);
  const agent = new Agent({
    apiKey: process.env.GPT_API_KEY as string,
    modelId: "gpt-4.1-mini",
    schema: accountingResponseSchema,
  });

  const noiseAgent = new Agent({
    apiKey: process.env.GPT_API_KEY as string,
    modelId: "gpt-5.1-chat-latest",
    schema: z.object({ isNoise: z.boolean() }),
    temperature: 1,
    systemPrompt:
      "You are noise detection bot. You will receive a message. You should find you if message is noize (conversation etc.) or does it contain useful accounting data. TRUE if just noise or FALSE if useful",
  });

  const sheets = await GoogleSheetsClient.init(
    process.env.PATH_TO_GOOGLE_KEYFILE as string,
  );

  const accountingService = new AccountingService({
    bot,
    agent,
    noiseAgent,
    sheets,
    sheetId: process.env.GOOGLE_SHEET_ID as string,
    tables: {
      income: "Каса!A1:C",
      expense: "Витрати!A1:C",
    },
  });

  accountingService.run();

  app.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "Server started");
  });
}

main().catch((err) => {
  throw new Error(err);
});
