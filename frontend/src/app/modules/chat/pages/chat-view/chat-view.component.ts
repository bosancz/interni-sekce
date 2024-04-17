import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ConversationResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { appConfig } from "src/config";
import { Logger } from "src/logger";

export interface ChatMessage {
  role: "assistant" | "user" | "tool";
  content: string;
  tool_calls: { endpoint: string }[];
}

@Component({
  selector: "bo-chat-view",
  templateUrl: "./chat-view.component.html",
  styleUrl: "./chat-view.component.scss",
})
export class ChatViewComponent implements OnInit {
  private readonly logger = new Logger(ChatViewComponent.name);

  conversation?: ConversationResponseWithLinks;

  prompt: string = "";

  messages: ChatMessage[] = [];

  loading = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params["prompt"]) this.sendInitialPrompt(params["prompt"]);
    });
  }

  public async sendPrompt() {
    if (this.loading) return;
    this.loading = true;

    const prompt = this.prompt.trim();
    this.prompt = "";

    this.messages.push({
      content: prompt,
      role: "user",
      tool_calls: [],
    });

    if (!this.conversation) {
      this.conversation = await this.createConversation();
    }

    const message: ChatMessage = {
      content: "",
      role: "assistant",
      tool_calls: [],
    };
    this.messages.push(message);

    await this.sendPromptRequest(this.conversation.id, prompt, message);

    this.loading = false;
  }

  private async sendPromptRequest(conversationId: number, prompt: string, message: ChatMessage) {
    // axios does not support streaming responses, so we use fetch instead
    const response = await fetch(`${appConfig.apiRoot}/chat/${conversationId}`, {
      body: JSON.stringify({ prompt }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      credentials: "include",
    });

    if (!response.body) throw new Error("ReadableStream not supported in this browser.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        this.parseResponseLine(buffer, message);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        this.parseResponseLine(line, message);
      }
    }
  }

  private parseResponseLine(line: string, message: ChatMessage) {
    try {
      const data = JSON.parse(line);
      if (data.content) message.content += data.content;
      if (data.tool_call) message.tool_calls.push(data.tool_call);
    } catch (e) {
      this.logger.error("Failed to parse response line", e);
    }
  }

  private async sendInitialPrompt(prompt: string) {
    this.prompt = prompt;

    await this.sendPrompt();

    this.router.navigate(["./"], { replaceUrl: true, relativeTo: this.route });
  }

  private async createConversation() {
    return this.api.chat.createConversation().then((res) => res.data);
  }
}
