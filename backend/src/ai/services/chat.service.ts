import { Injectable, Logger } from "@nestjs/common";
import { ParameterObject, ReferenceObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import axios from "axios";
import { EventEmitter } from "node:events";
import OpenAI from "openai";
import { Config } from "src/config";
import { OpenApiDocument } from "src/openapi";
import { OpenAIService } from "./openai.service";

interface ChatTool {
  path: string;
  method: string;
  parameters: ParameterObject[];
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
          parameters:
            operation.parameters?.filter((p): p is Exclude<typeof p, ReferenceObject> => !("$ref" in p)) ?? [],
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

    const response = await this.runTool(tool_call.function.name, tool_call.function.arguments);

    this.messages.push({
      tool_call_id: tool_call.id,
      role: "tool",
      content: JSON.stringify(response),
    });
  }

  private async runTool(name: string, args: any) {
    const tool = this.tools[name];
    if (!tool) return `Tool ${name} not found`;

    const args_object = JSON.parse(args);

    const params: Record<string, any> = {};
    const query: Record<string, any> = {};

    let path = `${Config.app.baseUrl}/api${tool.path}`;

    tool.parameters.forEach((param) => {
      if (!args_object[param.name]) return;

      if (param.in === "query") query[param.name] = args_object[param.name];
      else if (param.in === "path") path = path.replace(`{${param.name}}`, args_object[param.name]);
    });

    const data = await axios
      .request<any>({
        method: tool.method,
        url: path,
        params: query,
        headers: {
          Cookie: `token=${this.token}`,
        },
        responseType: "json",
      })
      .then((res) => res.data);

    if (Array.isArray(data)) data.forEach((item) => (item._links = undefined));
    else data._links = undefined;

    const urlParams = decodeURIComponent(new URLSearchParams(query).toString());
    this.emit("tool_call", {
      endpoint: `${tool.method.toUpperCase()} ${path}?${urlParams}`,
    });

    return data;
  }
}
