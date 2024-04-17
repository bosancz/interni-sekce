import { ApiProperty } from "@nestjs/swagger";
import { ChatCompletionMessageParam } from "openai/resources";
import { User } from "src/models/users/entities/user.entity";
import { Conversation } from "../entities/conversation.entity";

export class ConversationResponse implements Conversation {
  @ApiProperty() id!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() userId!: number;
  @ApiProperty() user!: User;
  @ApiProperty() messages!: ChatCompletionMessageParam[];
}
