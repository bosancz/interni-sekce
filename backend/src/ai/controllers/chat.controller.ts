import { Body, Controller, Get, NotFoundException, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { Token } from "src/auth/decorators/token.decorator";
import { UserGuard } from "src/auth/guards/user.guard";
import { TokenData } from "src/auth/schema/user-token";
import { ConversationChatDto } from "../dtos/ConversationChatDto";
import { ConversationRepository } from "../repositories/ConversationRepository";
import { ChatService } from "../services/chat.service";

@Controller("chat")
@ApiTags("Chat")
export class ChatController {
  constructor(
    private chatService: ChatService,
    private conversationRepository: ConversationRepository,
  ) {}

  @Get()
  @UseGuards(UserGuard)
  listConversations(@Token() token: TokenData) {
    return this.conversationRepository.getUserConversations(token.userId);
  }

  @Get(":id")
  @UseGuards(UserGuard)
  getConversation(@Token() token: TokenData, @Param("id") id: number) {
    return this.conversationRepository.getUserConversation(token.userId, id);
  }

  @Post()
  @UseGuards(UserGuard)
  async createConversation(@Token() token: TokenData) {
    const conversation = await this.conversationRepository.repository.save({
      userId: token.userId,
    });

    return conversation;
  }

  @Post(":id")
  @UseGuards(UserGuard)
  async prompt(
    @Token() token: TokenData,
    @Param("id") id: number,
    @Body() body: ConversationChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const conversation = await this.conversationRepository.getUserConversation(token.userId, id, {
      includeMessages: true,
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    const chat = this.chatService.createChat(conversation.messages, req.token);

    req.on("close", () => {
      chat.abortController?.abort();
    });

    chat.on("content", async (content: string) => {
      res.write(content);
    });

    chat.on("tool_call", (tool_call) => {
      res.write(`%%%TOOL_CALL%%%${tool_call}%%%TOOL_CALL_END%%%`);
    });

    await chat.prompt(body.prompt);

    conversation.messages = chat.messages;
    await this.conversationRepository.repository.save(conversation);

    res.end();
  }
}
