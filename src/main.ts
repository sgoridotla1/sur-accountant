import express from "express";

import "dotenv/config";

import TelegramClient from "./telegram";
import Agent from "./agent";
import { formatTelegramDate } from "./utils/time";
import GoogleSheetsClient from "./google-sheets";

const app = express();
const port = 3000;

async function main() {
  const bot = new TelegramClient(process.env.TELEGRAM_BOT_TOKEN as string);
  const agent = new Agent(process.env.GPT_API_KEY as string);
  const sheets = await GoogleSheetsClient.init();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);

    bot.onMessage(async (msg) => {
      try {
        const fileMeta = await bot.getFileMeta(msg);

        if (!fileMeta) return;

        const res = await fetch(fileMeta.fileUrl);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");

        const dateFormatted = formatTelegramDate(msg.date);
        const ocrResult = await agent.readTextFromImageBuffer(base64, {
          date: dateFormatted,
        });

        console.log(ocrResult);
        const replyText = JSON.stringify(ocrResult);

        bot.replyToMessage(msg.chat.id, msg.message_id, replyText);

        // console.log(path);
      } catch {}
    });

    bot.onReaction(async (msg) => {
      console.log("reaction", msg);

      const rows = await sheets.read(
        "1Uj5gZ5slSUmVyYVAbV1NIicUVzxyf94d_MFoX9M2n_Q",
      );
      console.log(rows);
      // bot.replyToMessage(msg.chat.id, msg.message_id, "puk 💩");
    });
  });
}

main().catch((err) => {
  throw new Error(err);
});
