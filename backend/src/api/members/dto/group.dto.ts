import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { AcLink, AcLinksObject } from "src/access-control/access-control-lib/schema/ac-link";
import { Group } from "src/models/members/entities/group.entity";
import { GroupsController } from "../controllers/groups.controller";

type LinkNames = ExtractExisting<keyof GroupsController, "deleteGroup" | "updateGroup" | "getGroup">;

export class GroupResponseLinks implements AcLinksObject<LinkNames> {
  @ApiProperty() deleteGroup!: AcLink;
  @ApiProperty() updateGroup!: AcLink;
  @ApiProperty() getGroup!: AcLink;
}

export class GroupResponse implements Group {
  @ApiProperty() id!: number;
  @ApiProperty() active!: boolean;
  @ApiProperty() shortName!: string;
  @ApiPropertyOptional({ type: "string" }) name!: string | null;
  @ApiPropertyOptional({ type: "string" }) deletedAt!: string | null;

  @ApiProperty() _links!: GroupResponseLinks;
}

export class CreateGroupBody implements Pick<Group, "shortName" | "name"> {
  @ApiProperty() @IsString() shortName!: string;
  @ApiPropertyOptional({ type: "string" }) @IsString() @IsOptional() name!: string | null;
}
