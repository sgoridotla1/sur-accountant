import TelegramBotApi from "node-telegram-bot-api";

// This should be able to poll data from telegram channel:
// - read text messages
// - read images

export type File = TelegramBotApi.File;

class TelegramClient {
  token: string;
  bot: TelegramBotApi;

  constructor(token: string) {
    this.token = token;
    this.bot = new TelegramBotApi(token, { polling: true });
  }

  onMessage(handler: (msg: TelegramBotApi.Message) => void) {
    this.bot.on("message", handler);
  }

  async getMessageType(msg: TelegramBotApi.Message) {}

  async getFileMeta(
    message: TelegramBotApi.Message,
  ): Promise<{ fileUrl: string; file: File } | null> {
    const image = message.photo?.pop();
    if (!image) return null;

    const { file_id: fileId } = image;
    const file = await this.bot.getFile(fileId);

    const fileUrl = `https://api.telegram.org/file/bot${this.token}/${file.file_path}`;

    return { fileUrl, file };
  }

  // getMessage() {
  //   this.bot.on("message", (msg) => {
  //     console.log(msg);
  //   });
  // }
}

export default TelegramClient;
