import { config } from "./config";

import TelegramClient from "./clients/telegram";
import GoogleSheetsClient from "./clients/google-sheets";

import { AccountingService } from "./features/accounting";
import { logger } from "./utils/logger";

async function main() {
  const bot = new TelegramClient(config.TELEGRAM_BOT_TOKEN);
  const sheets = await GoogleSheetsClient.init(config.PATH_TO_GOOGLE_KEYFILE);

  const accountingService = new AccountingService({
    bot,
    sheets,
    sheetId: config.GOOGLE_SHEET_ID,
    tables: {
      income: config.SHEET_TABLE_INCOME,
      expense: config.SHEET_TABLE_EXPENSE,
    },
    allowedTopics: config.ALLOWED_TOPIC_IDS,
    gpt: {
      apiKey: config.GPT_API_KEY,
      parseModel: config.GPT_MODEL_PARSE,
      noiseModel: config.GPT_MODEL_NOISE,
    },
  });

  accountingService.run();
}

main().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});
