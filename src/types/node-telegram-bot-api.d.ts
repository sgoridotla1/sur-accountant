import { MessageReactionUpdated } from "../clients/telegram/TelegramClient";

declare module "node-telegram-bot-api" {
  interface TelegramEvents {
    message_reaction: (reaction: MessageReactionUpdated) => any;
  }
}
