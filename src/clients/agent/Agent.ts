import { ChatOpenAI, OpenAIChatModelId } from "@langchain/openai";
import { StructuredToolInterface } from "@langchain/core/tools";
import { ToolMessage } from "@langchain/core/messages";
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
  maxTokens?: number;
  temperature?: number;
  tools?: StructuredToolInterface[];
};

type Messages = Array<SystemMessage | HumanMessage | AIMessage>;

class Agent<TSchema extends ZodTypeAny = ZodTypeAny> {
  agent: ReturnType<typeof createAgent>;
  private model: ChatOpenAI;
  private tools?: StructuredToolInterface[];

  constructor({
    apiKey,
    modelId,
    schema,
    systemPrompt,
    maxTokens = 1000,
    temperature = 0.1,
    tools,
  }: TAgentArgs<TSchema>) {
    this.model = new ChatOpenAI({
      apiKey,
      model: modelId,
      temperature,
      maxTokens,
    });

    this.tools = tools;

    this.agent = createAgent({
      systemPrompt,
      model: this.model,
      responseFormat: schema as unknown as ResponseFormat,
    });
  }

  async invoke({ messages }: { messages: Messages }) {
    let enrichedMessages: Array<BaseMessage> = [...messages];

    if (this.tools?.length) {
      const modelWithTools = this.model.bindTools(this.tools);
      const toolCallResult = await modelWithTools.invoke(enrichedMessages);

      if (toolCallResult.tool_calls?.length) {
        enrichedMessages.push(toolCallResult);
        for (const call of toolCallResult.tool_calls) {
          const t = this.tools.find((t) => t.name === call.name);
          const result = await t!.invoke(call.args);
          enrichedMessages.push(
            new ToolMessage({ content: result, tool_call_id: call.id! }),
          );
        }
      }
    }

    return await this.agent
      .invoke({ messages: enrichedMessages })
      .then((reply) => reply.structuredResponse as z.infer<TSchema>);
  }
}

export default Agent;
