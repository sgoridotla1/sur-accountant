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

type TAgentArgs<T> = {
  apiKey: string;
  modelId: OpenAIChatModelId;
  schema: T;
  systemPrompt?: string;
};

type Messages = Array<SystemMessage | HumanMessage | AIMessage>;

class Agent<TSchema extends ZodTypeAny = ZodTypeAny> {
  agent: ReturnType<typeof createAgent>;
  constructor({ apiKey, modelId, schema, systemPrompt }: TAgentArgs<TSchema>) {
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
}

export default Agent;
