import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ConversationChatDto {
  @ApiProperty() @IsString() prompt!: string;
}
