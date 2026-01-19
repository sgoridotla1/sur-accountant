import Agent from "../../clients/agent";
import { TFileMeta } from "../../clients/telegram";
import {
  accountingResponseSchema,
  TAccountingResponse,
} from "./accounting.schema";
import { HumanMessage, SystemMessage } from "langchain";
import { imageParserPrompt, textParsePrompt } from "./prompts";
import { today } from "../../utils/time";

export class AccountingService {
  constructor(private agent: Agent<typeof accountingResponseSchema>) {}

  async parseImage({
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

  async parseText({ message }: { message: string }) {
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
