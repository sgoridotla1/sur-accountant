import express from "express";

import "dotenv/config";

import TelegramBot from "./telegram-bot";
import Agent from "./agent";

const app = express();
const port = 3000;

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string).init();
  const agent = new Agent(process.env.GPT_API_KEY as string);

  bot.on("message", async (msg) => {
    console.log(msg);
    const { date, text } = msg;
    const dateFormatted = new Intl.DateTimeFormat("en-GB").format(date * 1000); // *1000 because telegram date is in seconds

    if (!text) return;

    try {
      const reply = await agent.getReply({
        message: text,
        date: dateFormatted,
      });
      console.log("===================\n");
      console.log(reply);
    } catch (err) {
      console.error("Agent failed:", err);
    }
  });
});
