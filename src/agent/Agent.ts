import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import z from "zod";

const accountingDataResponseFormat = z.object({
  trnasactions: z.array(
    z.object({
      date: z.string(),
      type: z.enum(["income", "expense"]),
      category: z.string(),
      amount: z.number(),
    })
  ),
});
class Agent {
  agent: ReturnType<typeof createAgent>;

  constructor(apiKey: string) {
    const accountingDataParser = tool(
      ({ query, today }) =>
        `Parse accounting data from ${query}. If any date specified use for all data, otherwise fallback to ${today}`,
      {
        name: "accounting-data-parser",
        schema: z.object({
          query: z
            .string()
            .describe("A query to parse and get accounting data"),
          today: z
            .string()
            .describe(
              "Date when message was sent. Use as a fallback if date not found"
            ),
        }),
      }
    );

    const model = new ChatOpenAI({
      apiKey,
      model: "gpt-4.1-nano",
      temperature: 0.1,
      maxTokens: 1000,
    });

    const systemPrompt = `
You are an expert accounting data extraction assistant.
Extract accounting transactions from text.

Use accounting_data_parser to return:
- type: income or expense
- amount: number
- category
`;

    this.agent = createAgent({
      systemPrompt,
      model,
      tools: [accountingDataParser],
      responseFormat: accountingDataResponseFormat,
    });
  }

  async getReply({ message, date }: { message: string; date: string }) {
    return await this.agent
      .invoke({
        messages: [
          {
            role: "user",
            content: `Today is ${date}. Get data from\n${message}`,
          },
        ],
      })
      .then((reply) => reply.structuredResponse);
  }
}

export default Agent;
