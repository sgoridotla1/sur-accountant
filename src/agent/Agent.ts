import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage, tool } from "langchain";
import z from "zod";

const accountingDataResponseFormat = z.object({
  transactions: z.array(
    z.object({
      date: z.string(),
      type: z.enum(["income", "expense"]),
      category: z.string(),
      amount: z.number(),
    }),
  ),
});

class Agent {
  agent: ReturnType<typeof createAgent>;

  constructor(apiKey: string) {
    const model = new ChatOpenAI({
      apiKey,
      model: "gpt-4.1-nano",
      temperature: 0.1,
      maxTokens: 1000,
    });

    const systemPrompt = `
    You are an expert accounting data extraction assistant. You extract data from varous inputs like text or images. Respond with data only.
    `;

    this.agent = createAgent({
      systemPrompt,
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

  async readTextFromImageBuffer(base64: string) {
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: "Extract all visible content from the image. I need only total.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64}`,
          },
        },
      ],
    });

    return await this.agent.invoke({
      messages: [message],
    });
  }
}

export default Agent;
