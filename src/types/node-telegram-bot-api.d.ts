import TelegramBot from "node-telegram-bot-api";

declare module "node-telegram-bot-api" {
  interface MessageReactionUpdated {
    chat: TelegramBot.Chat;
    message_id: number;
    date: number;
    user?: TelegramBot.User;
    old_reaction: TelegramBot.ReactionType[];
    new_reaction: TelegramBot.ReactionType[];
  }

  interface TelegramEvents {
    message_reaction: (reaction: MessageReactionUpdated) => any;
  }
}
