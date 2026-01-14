import TelegramBotApi from "node-telegram-bot-api";

// This should be able to poll data from telegram channel:
// - read text messages
// - read images

interface ITelegramBot {
  // getMessage(): void;
}

class TelegramBot implements ITelegramBot {
  bot: TelegramBotApi;

  constructor(token: string) {
    this.bot = new TelegramBotApi(token, { polling: true });
  }

  init() {
    return this.bot;
  }

  // getMessage() {
  //   this.bot.on("message", (msg) => {
  //     console.log(msg);
  //   });
  // }
}

export default TelegramBot;
