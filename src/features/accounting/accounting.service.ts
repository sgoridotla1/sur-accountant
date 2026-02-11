import { HumanMessage, SystemMessage } from "langchain";
import z from "zod";

import Agent from "../../clients/agent";
import TelegramClient, { TFileMeta } from "../../clients/telegram";
import GoogleSheetsClient from "../../clients/google-sheets";

import {
  accountingResponseSchema,
  TAccountingResponse,
} from "./accounting.schema";
import {
  prettifyTransactions,
  prettyOnRejected,
  prettyOnSaveFailure,
  prettyOnSaveSuccess,
  APPROVE_REACTIONS,
  REJECT_REACTIONS,
} from "./accounting.view";
import { imageParserPrompt, textParsePrompt } from "./prompts";
import { today } from "../../utils/time";
import { logger } from "../../utils/logger";

type TStoredMessage = {
  data: TAccountingResponse;
  threadId?: number;
};

type TAccountingServiceConfig = {
  bot: TelegramClient;
  agent: Agent<typeof accountingResponseSchema>;
  noiseAgent: Agent<z.ZodObject<{ isNoise: z.ZodBoolean }>>;
  sheets: GoogleSheetsClient;
  sheetId: string;
};

export class AccountingService {
  private bot: TelegramClient;
  private agent: Agent<typeof accountingResponseSchema>;
  private noiseAgent: Agent<z.ZodObject<{ isNoise: z.ZodBoolean }>>;
  private sheets: GoogleSheetsClient;
  private sheetId: string;
  private storage = new Map<number, TStoredMessage>();
  private logger = logger.child({ service: "accounting" });

  constructor(config: TAccountingServiceConfig) {
    this.bot = config.bot;
    this.agent = config.agent;
    this.noiseAgent = config.noiseAgent;
    this.sheets = config.sheets;
    this.sheetId = config.sheetId;
  }

  run() {
    this.bot.onMessage(async (msg) => {
      try {
        const fileMeta = await this.bot.getFileMeta(msg);
        let parseResult: TAccountingResponse | null = null;

        if (fileMeta) {
          parseResult = await this.parseImage({ fileMeta });
        } else if (msg.text) {
          const { isNoise } = await this.noiseAgent.invoke({
            messages: [new HumanMessage(msg.text ?? "")],
          });

          this.logger.debug({ isNoise }, "Noise detection result");
          if (isNoise) return;

          parseResult = await this.parseText({ message: msg.text });
        }

        this.logger.info({ count: parseResult?.transactions?.length }, "Parsed transactions");
        const replyText = parseResult ? prettifyTransactions(parseResult) : "";

        const replyMessage = await this.bot.replyToMessage(
          msg.chat.id,
          msg.message_id,
          replyText,
          { message_thread_id: msg.message_thread_id },
        );

        if (parseResult)
          this.storage.set(replyMessage.message_id, {
            data: parseResult,
            threadId: msg.message_thread_id,
          });
      } catch (err) {
        this.logger.error({ err, chatId: msg.chat.id }, "Failed to handle message");
      }
    });

    this.bot.onReaction(async (msg) => {
      try {
        this.logger.debug({ messageId: msg.message_id, chatId: msg.chat.id }, "Reaction received");
        const stored = this.storage.get(msg.message_id);

        this.logger.debug({ messageId: msg.message_id, hasStoredData: !!stored }, "Stored message lookup");

        const emoji =
          msg.new_reaction[0]?.type === "emoji"
            ? msg.new_reaction[0].emoji
            : null;

        if (!emoji) return;

        const isApproved = APPROVE_REACTIONS.has(emoji);
        const isRejected = REJECT_REACTIONS.has(emoji);

        if (!isApproved && !isRejected) return;

        const threadOpts = { message_thread_id: stored?.threadId };

        if (isRejected) {
          await this.bot.sendMessage(msg.chat.id, prettyOnRejected(), threadOpts);
          return;
        }

        if (stored) {
          const translationRows = stored.data.transactions.map(
            (transaction) => [...Object.values(transaction)],
          );

          const resultRows = await this.sheets.write(
            this.sheetId,
            "sur-accountant!A1:AA",
            translationRows,
          );
          await this.bot.sendMessage(
            msg.chat.id,
            prettyOnSaveSuccess(),
            threadOpts,
          );
          this.logger.info({ messageId: msg.message_id }, "Transactions saved to sheets");
        }
      } catch (err) {
        this.logger.error({ messageId: msg.message_id, err }, "Failed to handle reaction");

        await this.bot.sendMessage(msg.chat.id, prettyOnSaveFailure());
      }
    });
  }

  private async parseImage({
    fileMeta,
  }: {
    fileMeta: TFileMeta;
  }): Promise<TAccountingResponse> {
    const res = await fetch(fileMeta.fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const ocrResult = await this.agent.invoke({
      messages: [
        new SystemMessage(imageParserPrompt({ date: today() })),
        new HumanMessage("Parse data from this image"),
        new HumanMessage({
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
              },
            },
          ],
        }),
      ],
    });

    return ocrResult;
  }

  private async parseText({ message }: { message: string }) {
    const textResult = await this.agent.invoke({
      messages: [
        new SystemMessage(textParsePrompt({ date: today() })),
        new HumanMessage("Parse data from this message"),
        new HumanMessage(message),
      ],
    });

    return textResult;
  }
}
