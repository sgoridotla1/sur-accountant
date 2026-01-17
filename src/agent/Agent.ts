import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage, tool } from "langchain";
import z from "zod";
import { accountingSystemPrompt } from "./prompts";

const accountingDataResponseFormat = z.object({
  transactions: z.array(
    z.object({
      date: z.string(),
      type: z.enum(["income", "expense"]),
      category: z.string(),
      amount: z.number(),
    })
  ),
});

export type AccountingResponse = z.infer<typeof accountingDataResponseFormat>;

class Agent {
  agent: ReturnType<typeof createAgent>;

  constructor(apiKey: string) {
    const model = new ChatOpenAI({
      apiKey,
      model: "gpt-4.1-mini",
      temperature: 0.1,
      maxTokens: 1000,
    });

    this.agent = createAgent({
      systemPrompt: accountingSystemPrompt,
      model,
      responseFormat: accountingDataResponseFormat,
    });
  }

  async getReply({ message, date }: { message: string; date: string }) {
    return await this.agent
      .invoke({
        messages: [
          {
            role: "user",
            content: `${date}. Get accounting data from\n${message}`,
          },
        ],
      })
      .then((reply) => reply.structuredResponse);
  }

  async readTextFromImageBuffer(
    base64: string,
    meta: { date: string }
  ): Promise<AccountingResponse> {
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: `Today is ${meta.date}. Extract all visible content from the image. I need only total.`,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64}`,
          },
        },
      ],
    });

    return await this.agent
      .invoke({
        messages: [message],
      })
      .then((r) => r.structuredResponse as AccountingResponse);
  }
}

export default Agent;
