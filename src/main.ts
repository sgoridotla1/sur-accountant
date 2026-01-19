import express from "express";
import { AIMessage, HumanMessage, SystemMessage } from "langchain";

import "dotenv/config";

import TelegramClient from "./clients/telegram";
import Agent from "./clients/agent";
import GoogleSheetsClient from "./clients/google-sheets";

import {
  AccountingService,
  TAccountingResponse,
  accountingResponseSchema,
} from "./features/accounting";
import {
  prettifyTransactions,
  prettyOnRejected,
  prettyOnSaveFailure,
  prettyOnSaveSuccess,
} from "./features/accounting/accounting.view";
import z from "zod";

const app = express();
const port = 3000;

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID as string;

// TODO: Use more sophisticated solution :)
const dumpStorage = new Map<number, TAccountingResponse>();

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

  const accountingService = new AccountingService(agent);

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);

    bot.onMessage(async (msg) => {
      try {
        const fileMeta = await bot.getFileMeta(msg);
        let parseResult: TAccountingResponse | null = null;

        if (fileMeta) {
          parseResult = await accountingService.parseImage({
            fileMeta,
          });
        } else if (msg.text) {
          const { isNoise } = await noiseAgent.invoke({
            messages: [new HumanMessage(msg.text ?? "")],
          });

          console.log(isNoise);
          if (isNoise) return;

          parseResult = await accountingService.parseText({
            message: msg.text,
          });
        }

        console.log(parseResult);
        const replyText = parseResult ? prettifyTransactions(parseResult) : "";

        const replyMessage = await bot.replyToMessage(
          msg.chat.id,
          msg.message_id,
          replyText,
        );

        if (parseResult) dumpStorage.set(replyMessage.message_id, parseResult);
      } catch {}
    });

    bot.onReaction(async (msg) => {
      try {
        console.log(msg);
        const messageRelatedData = dumpStorage.get(msg.message_id);

        console.log("Message related data", messageRelatedData);

        // @ts-ignore TODO: Extend msg interface with reaction feature
        const isRejected = msg.new_reaction[0]?.emoji === "💩";
        // @ts-ignore TODO: Extend msg interface with reaction feature
        const reactionsCount = msg.new_reaction.length;

        if (reactionsCount > 1) return;

        // TODO: Create rejected error type
        if (isRejected) {
          bot.sendMessage(msg.chat.id, prettyOnRejected());
          return;
        }

        if (messageRelatedData) {
          const translationRows = messageRelatedData.transactions.map(
            (transaction) => [...Object.values(transaction)],
          );

          const resultRows = await sheets.write(
            GOOGLE_SHEET_ID,
            "sur-accountant!A1:AA",
            translationRows,
          );
          await bot.sendMessage(msg.chat.id, prettyOnSaveSuccess());
          console.log(resultRows);
        }
      } catch (err) {
        console.error(
          `Failed to perform an action on reaction to the message:${msg.message_id}`,
          err,
        );

        await bot.sendMessage(msg.chat.id, prettyOnSaveFailure());
      }
      // bot.replyToMessage(msg.chat.id, msg.message_id, "puk 💩");
    });
  });
}

main().catch((err) => {
  throw new Error(err);
});
