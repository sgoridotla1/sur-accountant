import z from "zod";

import { config } from "./config";

import TelegramClient from "./clients/telegram";
import Agent from "./clients/agent";
import GoogleSheetsClient from "./clients/google-sheets";

import {
  AccountingService,
  accountingResponseSchema,
} from "./features/accounting";
import { noiseDetectionPrompt } from "./features/accounting/prompts";
import { logger } from "./utils/logger";

async function main() {
  const bot = new TelegramClient(config.TELEGRAM_BOT_TOKEN);
  const agent = new Agent({
    apiKey: config.GPT_API_KEY,
    modelId: config.GPT_MODEL_PARSE,
    schema: accountingResponseSchema,
  });

  const noiseAgent = new Agent({
    apiKey: config.GPT_API_KEY,
    modelId: config.GPT_MODEL_NOISE,
    schema: z.object({ isNoise: z.boolean() }),
    temperature: 1,
    systemPrompt: noiseDetectionPrompt,
  });

  const sheets = await GoogleSheetsClient.init(config.PATH_TO_GOOGLE_KEYFILE);

  const accountingService = new AccountingService({
    bot,
    agent,
    noiseAgent,
    sheets,
    sheetId: config.GOOGLE_SHEET_ID,
    tables: {
      income: config.SHEET_TABLE_INCOME,
      expense: config.SHEET_TABLE_EXPENSE,
    },
    allowedTopics: config.ALLOWED_TOPIC_IDS,
  });

  accountingService.run();
}

main().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});
