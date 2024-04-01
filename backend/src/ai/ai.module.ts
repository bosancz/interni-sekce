import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./controllers/chat.controller";
import { Conversation } from "./entities/conversation.entity";
import { ConversationRepository } from "./repositories/ConversationRepository";
import { ChatService } from "./services/chat.service";
import { OpenAIService } from "./services/openai.service";

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  providers: [OpenAIService, ChatService, ConversationRepository],
  controllers: [ChatController],
})
export class AiModule {}
