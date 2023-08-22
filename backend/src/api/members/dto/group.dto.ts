import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { Group } from "src/models/members/entities/group.entity";

export class GroupResponse implements Group {
  @ApiProperty() id!: number;
  @ApiProperty() active!: boolean;
  @ApiProperty() shortName!: string;
  @ApiPropertyOptional({ type: "string" }) color!: string | null;
  @ApiPropertyOptional({ type: "string" }) darkColor!: string | null;
  @ApiPropertyOptional({ type: "string" }) name!: string | null;
  @ApiPropertyOptional({ type: "string" }) deletedAt!: string | null;
}

export class CreateGroupBody implements Pick<Group, "shortName" | "name"> {
  @ApiProperty() @IsString() shortName!: string;
  @ApiPropertyOptional({ type: "string" }) @IsString() @IsOptional() name!: string | null;
}

export class UpdateGroupBody implements Partial<Pick<Group, "shortName" | "name">> {
  @ApiProperty() @IsString() shortName!: string;
  @ApiPropertyOptional({ type: "string" }) @IsString() @IsOptional() name!: string | null;
}
