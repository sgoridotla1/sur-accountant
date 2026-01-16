import express from "express";

import "dotenv/config";

import TelegramClient from "./telegram";
import Agent from "./agent";
import Storage from "./storage";
import { formatTelegramDate } from "./utils/time";

const app = express();
const port = 3000;

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  const bot = new TelegramClient(process.env.TELEGRAM_BOT_TOKEN as string);
  const agent = new Agent(process.env.GPT_API_KEY as string);
  // const storage = new Storage();

  bot.onMessage(async (msg) => {
    console.log(msg);
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
      const replyText = ocrResult.transactions
        .map(
          (row) =>
            `${row.date} - ${row.type} - ${row.category} - ${row.amount}`,
        )
        .join("\n");

      bot.replyToMessage(msg.chat.id, msg.message_id, replyText);

      // console.log(path);
    } catch {}
  });

  // bot.on("message", async (msg) => {
  //   console.log(msg);
  //   const { date, text } = msg;
  //   const dateFormatted = new Intl.DateTimeFormat("en-GB").format(date * 1000); // *1000 because telegram date is in seconds

  //   getImage(msg);

  //   if (!text) return;

  //   try {
  //     const reply = await agent.getReply({
  //       message: text,
  //       date: dateFormatted,
  //     });
  //     console.log("===================\n");
  //     console.log(reply);
  //   } catch (err) {
  //     console.error("Agent failed:", err);
  //   }
  // });
});
