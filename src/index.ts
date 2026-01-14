import express from "express";

import "dotenv/config";

import TelegramBot from "./telegram-bot";

const app = express();
const port = 3000;

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string).init();
  bot.on("message", (msg) => {
    console.log(msg);
  });
});
