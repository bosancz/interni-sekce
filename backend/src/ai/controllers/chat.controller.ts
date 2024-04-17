import { Body, Controller, NotFoundException, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Token } from "src/auth/decorators/token.decorator";
import { UserGuard } from "src/auth/guards/user.guard";
import { TokenData } from "src/auth/schema/user-token";
import { ConversationChatRoute, ConversationCreateRoute } from "../acl/Conversation.acl";
import { ConversationChatBody } from "../dto/ConversationChatBody.dto";
import { ConversationResponse } from "../dto/ConversationResponse.dto";
import { ConversationRepository } from "../repositories/ConversationRepository";
import { ChatService } from "../services/chat.service";

@Controller("chat")
@ApiTags("Chat")
@AcController()
@UseGuards(UserGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private conversationRepository: ConversationRepository,
  ) {}

  // @Get()
  // @AcLinks(ConversationsListRoute)
  // async listConversations(@Req() req: Request, @Token() token: TokenData) {
  //   ConversationsListRoute.canOrThrow(req, undefined);

  //   return this.conversationRepository.getUserConversations(token.userId);
  // }

  @Post()
  @AcLinks(ConversationCreateRoute)
  @ApiResponse({ type: WithLinks(ConversationResponse) })
  async createConversation(@Req() req: Request, @Token() token: TokenData) {
    ConversationCreateRoute.canOrThrow(req, undefined);

    const conversation = await this.conversationRepository.repository.save({
      userId: token.userId,
    });

    return conversation;
  }

  // @Get(":id")
  // @AcLinks(ConversationReadRoute)
  // async readConversation(@Req() req: Request, @Token() token: TokenData, @Param("id") id: number) {
  //   const conversation = await this.conversationRepository.getUserConversation(token.userId, id);
  //   if (!conversation) throw new NotFoundException("Conversation not found");

  //   ConversationReadRoute.canOrThrow(req, conversation);

  //   return conversation;
  // }

  @Post(":id")
  @AcLinks(ConversationChatRoute)
  @ApiResponse({ schema: { type: "string" } })
  async prompt(
    @Token() token: TokenData,
    @Param("id") id: number,
    @Body() body: ConversationChatBody,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const conversation = await this.conversationRepository.getUserConversation(token.userId, id, {
      includeMessages: true,
    });
    if (!conversation) throw new NotFoundException("Conversation not found");

    ConversationChatRoute.canOrThrow(req, conversation);

    const chat = this.chatService.createChat(conversation.messages, req.token);

    req.on("close", () => {
      chat.abortController?.abort();
    });

    chat.on("content", async (content: string) => {
      res.write(JSON.stringify({ content }) + "\n");
    });

    chat.on("tool_call", (tool_call) => {
      res.write(JSON.stringify({ tool_call }) + "\n");
    });

    await chat.prompt(body.prompt);

    conversation.messages = chat.messages;
    await this.conversationRepository.repository.save(conversation);

    res.end();
  }
}
