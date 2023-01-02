import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Group } from "src/models/members/entities/group.entity";

export class GroupResponse implements Group {
  @ApiProperty() id!: string;
  @ApiProperty() active!: boolean;
  @ApiPropertyOptional({ type: "string" }) name!: string | null;
}
