import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "../entities/conversation.entity";

@Injectable()
export class ConversationRepository {
  constructor(@InjectRepository(Conversation) public readonly repository: Repository<Conversation>) {}

  async getUserConversations(userId: number) {
    return await this.repository.find({
      where: { userId },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        messages: false,
      },
    });
  }
  async getUserConversation(userId: number, id: number, options: { includeMessages?: boolean } = {}) {
    return await this.repository.findOne({
      select: {
        id: true,
        userId: true,
        createdAt: true,
        messages: options.includeMessages,
      },
      where: { userId, id },
    });
  }
}
