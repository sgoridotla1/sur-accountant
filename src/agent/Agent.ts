import { ChatOpenAI, OpenAIChatModelId } from "@langchain/openai";
import {
  createAgent,
  ResponseFormat,
  BaseMessage,
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "langchain";
import z, { ZodTypeAny } from "zod";

type TextAgentArgs<T> = {
  apiKey: string;
  modelId: OpenAIChatModelId;
  schema: T;
  systemPrompt?: string;
};

type Messages = Array<SystemMessage | HumanMessage | AIMessage>;

interface IAgent<T> {
  parseText({ messages }: { messages: Messages }): Promise<T>;
}

class Agent<TSchema extends ZodTypeAny> {
  agent: ReturnType<typeof createAgent>;
  constructor({
    apiKey,
    modelId,
    schema,
    systemPrompt,
  }: TextAgentArgs<TSchema>) {
    const model = new ChatOpenAI({
      apiKey,
      model: modelId,
      temperature: 0.1,
      maxTokens: 1000,
    });

    this.agent = createAgent({
      systemPrompt,
      model,
      responseFormat: schema as unknown as ResponseFormat,
    });
  }

  async invoke({ messages }: { messages: Messages }) {
    return await this.agent
      .invoke({
        messages,
      })
      .then((reply) => reply.structuredResponse as z.infer<TSchema>);
  }

  async parseImage({
    messages,
    base64,
  }: {
    messages?: Messages;
    base64: string;
  }) {
    const withImage = [
      ...(messages || []),
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
    ];

    const result = await this.invoke({ messages: withImage });
    return result;
  }
}

export default Agent;
