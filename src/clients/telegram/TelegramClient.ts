import TelegramBotApi from "node-telegram-bot-api";

export type TFile = TelegramBotApi.File;
export type TFileMeta = {
  fileUrl: string;
  file: TFile;
};

export type MessageReactionUpdated = {
  chat: TelegramBotApi.Chat;
  message_id: number;
  date: number;
  old_reaction: ReactionType[];
  new_reaction: ReactionType[];
};

type ReactionType =
  | { type: "emoji"; emoji: string }
  | { type: "custom_emoji"; custom_emoji_id: string };

class TelegramClient {
  token: string;
  bot: TelegramBotApi;

  constructor(token: string) {
    this.token = token;
    this.bot = new TelegramBotApi(token, {
      polling: {
        params: {
          allowed_updates: ["message", "message_reaction"],
        },
      },
    });
  }

  onMessage(handler: (msg: TelegramBotApi.Message) => void) {
    this.bot.on("message", handler);
  }

  onReaction(
    handler: (msg: MessageReactionUpdated) => void,
  ) {
    this.bot.on("message_reaction", handler);
  }

  async getFileMeta(
    message: TelegramBotApi.Message,
  ): Promise<TFileMeta | null> {
    const image = message.photo?.pop();
    if (!image) return null;

    const { file_id: fileId } = image;
    const file = await this.bot.getFile(fileId);

    const fileUrl = `https://api.telegram.org/file/bot${this.token}/${file.file_path}`;

    return { fileUrl, file };
  }

  async replyToMessage(
    chatId: TelegramBotApi.ChatId,
    messageId: number,
    text: string,
    options?: { message_thread_id?: number },
  ): Promise<TelegramBotApi.Message> {
    const message = await this.bot.sendMessage(chatId, text, {
      reply_to_message_id: messageId,
      message_thread_id: options?.message_thread_id,
    });

    return message;
  }

  async sendMessage(
    chatId: TelegramBotApi.ChatId,
    text: string,
    options?: { message_thread_id?: number },
  ): Promise<TelegramBotApi.Message> {
    const message = await this.bot.sendMessage(chatId, text, {
      message_thread_id: options?.message_thread_id,
    });

    return message;
  }

  async deleteMessage(
    chatId: TelegramBotApi.ChatId,
    messageId: number,
  ): Promise<void> {
    await this.bot.deleteMessage(chatId, messageId);
  }

  async setReaction(
    chatId: TelegramBotApi.ChatId,
    messageId: number,
    emoji: string,
  ): Promise<void> {
    await (this.bot as any)._request("setMessageReaction", {
      form: {
        chat_id: chatId,
        message_id: messageId,
        reaction: JSON.stringify([{ type: "emoji", emoji }]),
      },
    });
  }
}

export default TelegramClient;
