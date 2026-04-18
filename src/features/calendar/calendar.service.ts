import { HumanMessage } from "langchain";

import Agent from "../../clients/agent";
import TelegramClient from "../../clients/telegram";
import GoogleCalendarClient from "../../clients/google-calendar/GoogleCalendarClient";

import { calendarResponseSchema, TCalendarEvent } from "./calendar.schema";
import { prettifyEvent, APPROVE_REACTIONS, REJECT_REACTIONS } from "./calendar.view";
import { calendarParsePrompt } from "./calendar.prompts";
import { getTodayDate } from "../../utils/time";
import { logger } from "../../utils/logger";

type TStoredEvent = {
  event: TCalendarEvent;
  originalMessageId: number;
  threadId?: number;
};

type TCalendarServiceConfig = {
  bot: TelegramClient;
  calendar: GoogleCalendarClient;
  topicId: number;
  gpt: {
    apiKey: string;
    parseModel: string;
  };
};

export class CalendarService {
  private bot: TelegramClient;
  private calendar: GoogleCalendarClient;
  private agent: Agent<typeof calendarResponseSchema>;
  private topicId: number;
  private storage = new Map<number, TStoredEvent>();
  private logger = logger.child({ service: "calendar" });

  constructor(config: TCalendarServiceConfig) {
    this.bot = config.bot;
    this.calendar = config.calendar;
    this.topicId = config.topicId;

    this.agent = new Agent({
      apiKey: config.gpt.apiKey,
      modelId: config.gpt.parseModel,
      schema: calendarResponseSchema,
      tools: [getTodayDate],
      systemPrompt: calendarParsePrompt(),
    });
  }

  run() {
    this.bot.onMessage(async (msg) => {
      this.logger.debug(
        { chatId: msg.chat.id, topicId: msg.message_thread_id },
        "Message received",
      );

      if (msg.message_thread_id !== this.topicId) return;
      if (!msg.text) return;

      try {
        const parseResult = await this.agent.invoke({
          messages: [new HumanMessage(msg.text)],
        });

        if (!parseResult?.events?.length) {
          this.logger.info({ chatId: msg.chat.id }, "No events detected, skipping");
          return;
        }

        this.logger.info({ count: parseResult.events.length }, "Parsed events");

        for (const event of parseResult.events) {
          const replyText = prettifyEvent(event);
          const replyMessage = await this.bot.replyToMessage(
            msg.chat.id,
            msg.message_id,
            replyText,
            { message_thread_id: msg.message_thread_id, parse_mode: "HTML" },
          );

          this.storage.set(replyMessage.message_id, {
            event,
            threadId: msg.message_thread_id,
            originalMessageId: msg.message_id,
          });
        }
      } catch (err) {
        this.logger.error({ err, chatId: msg.chat.id }, "Failed to handle message");
      }
    });

    this.bot.onReaction(async (msg) => {
      try {
        this.logger.debug(
          { messageId: msg.message_id, chatId: msg.chat.id },
          "Reaction received",
        );

        const stored = this.storage.get(msg.message_id);
        if (!stored) return;
        this.storage.delete(msg.message_id);

        const emoji =
          msg.new_reaction[0]?.type === "emoji"
            ? msg.new_reaction[0].emoji
            : null;

        if (!emoji) return;

        const isApproved = APPROVE_REACTIONS.has(emoji);
        const isRejected = REJECT_REACTIONS.has(emoji);

        if (!isApproved && !isRejected) return;

        await this.bot.deleteMessage(msg.chat.id, msg.message_id);

        if (isRejected) {
          await this.bot.setReaction(msg.chat.id, stored.originalMessageId, "👎");
          return;
        }

        if (isApproved) {
          const { title, date, description } = stored.event;
          await this.calendar.createEvent(title, date, description);
          await this.bot.setReaction(msg.chat.id, stored.originalMessageId, "👍");
          this.logger.info({ title, date }, "Event saved to calendar");
        }
      } catch (err) {
        this.logger.error(
          { messageId: msg.message_id, err },
          "Failed to handle reaction",
        );
        await this.bot.sendMessage(
          msg.chat.id,
          "😩 Упс, не сьогодні... Щось пішло не так\ncc @sgdtl",
        );
      }
    });
  }
}
