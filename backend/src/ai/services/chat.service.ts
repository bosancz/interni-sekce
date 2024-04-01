import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { EventEmitter } from "node:events";
import OpenAI from "openai";
import { Config } from "src/config";
import { OpenApiDocument } from "src/openapi";
import { OpenAIService } from "./openai.service";

interface ChatTool {
  path: string;
  method: string;
  tool: OpenAI.Chat.Completions.ChatCompletionTool;
}

type ChatTools = Record<string, ChatTool>;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  private tools!: ChatTools;

  constructor(private openai: OpenAIService) {
    // FIXME: This is a hack to wait for the OpenAPI routes to initialize
    setTimeout(() => this.init(), 2000);
  }

  private init() {
    this.tools = this.createTools();
    this.logger.verbose(`ChatService initialized. Tools: ${Object.keys(this.tools).join(", ")}`);
  }

  createChat(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], token?: string) {
    const client = this.openai.getClient();

    return new ChatInstance(client, messages, this.tools, token);
  }

  private createTools(): ChatTools {
    const tools: ChatTools = {};

    for (let [path, operations] of Object.entries(OpenApiDocument.paths)) {
      const methods = ["get", "post", "put", "delete", "patch", "head", "options", "trace"] as const;

      for (let method of methods) {
        const operation = operations[method];
        if (!operation || !operation.operationId || !operation.description) continue;

        const name = operation.operationId;
        const description = operation.description;

        const parameters = {
          type: "object",
          properties: {} as any,
        };

        for (let parameter of operation.parameters ?? []) {
          if (!("name" in parameter)) continue;
          if (!parameter.schema) continue;
          if ("$ref" in parameter.schema) continue;

          parameters.properties![parameter.name] = parameter.schema;
        }

        tools[name] = {
          path,
          method,
          tool: {
            type: "function",
            function: {
              name,
              description,
              parameters,
            },
          },
        };
      }
    }

    return tools;
  }
}
/**
 * ChatInstance
 *
 * This class is responsible for handling the chat conversation with OpenAI.
 *
 */
export class ChatInstance extends EventEmitter {
  private readonly logger = new Logger(ChatInstance.name);

  public events = new EventEmitter();

  public abortController?: AbortController;

  constructor(
    private client: OpenAI,
    public messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    private tools: ChatTools,
    private token?: string,
  ) {
    super();
  }

  async prompt(prompt: string) {
    this.messages.push({ role: "user", content: prompt });

    let message = await this.getChatResponse();

    // If the response contains tool calls, handle them and ask OpenAI for the response again
    while (message.tool_calls) {
      for (let tool_call of message.tool_calls) {
        await this.callTool(tool_call);
      }

      message = await this.getChatResponse();
    }
  }

  private async getChatResponse() {
    this.logger.debug("ChatInstance.getChatResponse");

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "Jsi Čibu-čibu, duch ostrova ŠÁN. Šán, neboli Bošán je Dětská vodácká skupina sídlící v Praze v Modřanech na Káčku. Čibu-čibu je duch ostrova ŠÁN, dlouho byl schovaný v památném stromě, ale ten odnesla voda a tak je teď schovaný v ChatGPT. ŠÁN je náš ostrov (pozpátku se to čte náš) na Labi blízko obce Hrobce. Na ostrov děláme pravidelné letní vodácké tábory. Máš přístup k webovým stránkám a můžeš tam leccos najít.",
      },
      ...this.messages,
    ];

    const tools = Object.values(this.tools).map((tool) => tool.tool);

    const response = await this.client.chat.completions.create({
      model: Config.ai.chat.model,
      messages,
      stream: true,
      tools,
    });

    this.abortController = response.controller;

    const message: OpenAI.Chat.Completions.ChatCompletionMessage = {
      content: "",
      role: "assistant",
    };

    for await (const chunk of response) {
      if (chunk.choices[0].delta.content) {
        message.content += chunk.choices[0].delta.content ?? "";
        this.emit("content", chunk.choices[0].delta.content);
      }

      if (chunk.choices[0].delta.tool_calls) {
        if (!message.tool_calls) message.tool_calls = [];

        chunk.choices[0].delta.tool_calls.forEach((toolCall, i) => {
          if (!message.tool_calls![i]) {
            message.tool_calls!.push({ id: "", type: "function", function: { name: "", arguments: "" } });
          }

          message.tool_calls![i].id += toolCall.id ?? "";
          message.tool_calls![i].function.name += toolCall.function?.name ?? "";
          message.tool_calls![i].function.arguments += toolCall.function?.arguments ?? "";
        });
      }
    }

    this.messages.push(message);

    return message;
  }

  private async callTool(tool_call: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
    this.logger.debug("ChatInstance.callTool", JSON.stringify(tool_call));

    const response = await this.runToll(tool_call.function.name, tool_call.function.arguments);

    this.messages.push({
      tool_call_id: tool_call.id,
      role: "tool",
      content: JSON.stringify(response),
    });
  }

  private async runToll(name: string, args: any) {
    const tool = this.tools[name];
    if (!tool) return `Tool ${name} not found`;

    const args_object = JSON.parse(args);
    const params = Object.keys(args_object).reduce(
      (acc, key) => {
        acc[key] = args_object[key];
        return acc;
      },
      {} as Record<string, any>,
    );

    const data = await axios
      .request<any>({
        method: tool.method,
        url: `${Config.app.baseUrl}/api${tool.path}`,
        params,
        headers: {
          Cookie: `token=${this.token}`,
        },
        responseType: "json",
      })
      .then((res) => res.data);

    if (Array.isArray(data)) data.forEach((item) => (item._links = undefined));
    else data._links = undefined;

    this.emit("tool_call", `${tool.method.toUpperCase()} ${tool.path}?${new URLSearchParams(params)}`);

    return data;
  }
}
