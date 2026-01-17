import express from "express";

import "dotenv/config";

import TelegramClient from "./telegram";
import Agent from "./agent"; // type AccountingResponse, // accountingDataResponseFormat,
import { formatTelegramDate } from "./utils/time";
import GoogleSheetsClient from "./google-sheets";
import { AIMessage, HumanMessage, SystemMessage } from "langchain";
import {
  accountingDataResponseFormat,
  AccountingResponse,
} from "./agent/_Agent";

const app = express();
const port = 3000;

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID as string;

// TODO: Use more sophisticated solution :)
const dumpStorage = new Map<number, AccountingResponse>();

async function main() {
  const bot = new TelegramClient(process.env.TELEGRAM_BOT_TOKEN as string);
  // const agent = new Agent(process.env.GPT_API_KEY as string);
  const textAgent = new Agent({
    apiKey: process.env.GPT_API_KEY as string,
    modelId: "gpt-4.1-mini",
    schema: accountingDataResponseFormat,
  });

  const imageAgent = new Agent({
    apiKey: process.env.GPT_API_KEY as string,
    modelId: "gpt-4.1-mini",
    schema: accountingDataResponseFormat,
  });

  const sheets = await GoogleSheetsClient.init(
    process.env.PATH_TO_GOOGLE_KEYFILE as string
  );

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);

    bot.onMessage(async (msg) => {
      try {
        const dateFormatted = formatTelegramDate(msg.date);
        const fileMeta = await bot.getFileMeta(msg);

        let parseResult: AccountingResponse;

        if (fileMeta) {
          const res = await fetch(fileMeta.fileUrl);
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString("base64");

          parseResult = await imageAgent.parseImage({
            base64,
            messages: [
              new SystemMessage(
                "You are accounting expert. You always provide precise accounting data from receipts. You provide only total, usually 'Всього', 'Разом'"
              ),
              new SystemMessage(
                `You are super strict with dates. You put date from receipt to each transaction. If no date, you fallback to today ${dateFormatted}`
              ),
              new HumanMessage({
                content: [
                  {
                    type: "text",
                    text: "Please parse data from the image",
                  },
                ],
              }),
            ],
          });
        } else {
          parseResult = await textAgent.invoke({
            messages: [
              new SystemMessage(
                "You are accounting expert. You always provide precise accounting data from receipts. You provide only total"
              ),
              new SystemMessage(
                `You are super strict with dates. You put date from receipt to each transaction. If no date, you fallback to today ${dateFormatted}`
              ),
              new HumanMessage({
                content: [
                  {
                    type: "text",
                    text: `Please parse data from my employee message\n${msg.text}}`,
                  },
                ],
              }),
            ],
          });
        }

        console.log(parseResult);
        const replyText = JSON.stringify(parseResult);

        const replyMessage = await bot.replyToMessage(
          msg.chat.id,
          msg.message_id,
          replyText
        );

        dumpStorage.set(replyMessage.message_id, parseResult);
      } catch {}
    });

    bot.onReaction(async (msg) => {
      try {
        console.log(msg);
        const messageRelatedData = dumpStorage.get(msg.message_id);

        console.log("Message related data", messageRelatedData);

        if (messageRelatedData) {
          const translationRows = messageRelatedData.transactions.map(
            (transaction) => [...Object.values(transaction)]
          );

          const resultRows = await sheets.write(
            GOOGLE_SHEET_ID,
            "sur-accountant!A1:AA",
            translationRows
          );

          console.log(resultRows);
        }

        // const rows = await sheets.write(
        //   GOOGLE_SHEET_ID,
        //   "sur-accountant!A1:E",
        //   [Date.now()]
        // );
        // console.log(rows);
      } catch (err) {
        console.error(
          `Failed to perform an action on reaction to the message:${msg.message_id}`,
          err
        );
      }
      // bot.replyToMessage(msg.chat.id, msg.message_id, "puk 💩");
    });
  });
}

main().catch((err) => {
  throw new Error(err);
});
