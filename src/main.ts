import { config } from "./config";

import TelegramClient from "./clients/telegram";
import GoogleSheetsClient from "./clients/google-sheets";
import { GoogleCalendarClient } from "./clients/google-calendar";

import { AccountingService } from "./features/accounting";
import { ShiftService } from "./features/shift";
import { CalendarService } from "./features/calendar";
import { logger } from "./utils/logger";

async function main() {
  const bot = new TelegramClient(config.TELEGRAM_BOT_TOKEN);
  const sheets = new GoogleSheetsClient(config.PATH_TO_GOOGLE_KEYFILE);
  const googleCalendar = new GoogleCalendarClient(
    config.PATH_TO_GOOGLE_KEYFILE,
    config.GOOGLE_CALENDAR_ID,
  );

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

  const shiftService = new ShiftService({
    bot,
    sheets,
    sheetId: config.GOOGLE_SHEET_ID,
    table: config.SHEET_TABLE_SHIFTS,
    topicId: config.SHIFT_TOPIC_ID,
    gpt: {
      apiKey: config.GPT_API_KEY,
      parseModel: config.GPT_MODEL_PARSE,
    },
  });

  shiftService.run();

  const calendarService = new CalendarService({
    bot,
    calendar: googleCalendar,
    topicId: config.CALENDAR_TOPIC_ID,
    gpt: {
      apiKey: config.GPT_API_KEY,
      parseModel: config.GPT_MODEL_PARSE,
    },
  });

  calendarService.run();
}

main().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});
