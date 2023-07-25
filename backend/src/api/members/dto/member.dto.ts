import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { AcEntity, WithLinks } from "src/access-control/access-control-lib";
import { Group } from "src/models/members/entities/group.entity";
import { MemberAchievement } from "src/models/members/entities/member-achievements.entity";
import { MemberContact } from "src/models/members/entities/member-contacts.entity";
import { Member, MemberRank, MemberRole, MembershipStatus } from "src/models/members/entities/member.entity";
import { GroupResponse } from "./group.dto";

export class MemberResponse implements Member {
  @ApiProperty() id!: number;
  @ApiProperty() groupId!: number;
  @ApiProperty({ type: "string" }) nickname!: string;

  @ApiPropertyOptional({ type: "boolean" }) active!: boolean;
  @ApiPropertyOptional({ type: "string", enum: MembershipStatus }) membership!: MembershipStatus;
  @ApiPropertyOptional({ type: "string" }) function!: string | null;
  @ApiPropertyOptional({ type: "string" }) firstName!: string | null;
  @ApiPropertyOptional({ type: "string" }) lastName!: string | null;
  @ApiPropertyOptional({ type: "string" }) birthday!: string | null;
  @ApiPropertyOptional({ type: "string" }) addressStreet!: string | null;
  @ApiPropertyOptional({ type: "string" }) addressStreetNo!: string | null;
  @ApiPropertyOptional({ type: "string" }) addressCity!: string | null;
  @ApiPropertyOptional({ type: "string" }) addressPostalCode!: string | null;
  @ApiPropertyOptional({ type: "string" }) addressCountry!: string | null;
  @ApiPropertyOptional({ type: "string" }) mobile!: string | null;
  @ApiPropertyOptional({ type: "string" }) email!: string | null;
  @ApiPropertyOptional({ type: "enum", enum: MemberRole }) role!: MemberRole | null;
  @ApiPropertyOptional({ type: "enum", enum: MemberRank }) rank!: MemberRank | null;

  @AcEntity(GroupResponse)
  @ApiPropertyOptional({ type: WithLinks(GroupResponse) })
  group?: Group | undefined;

  @ApiPropertyOptional()
  contacts?: MemberContact[] | undefined;

  @ApiPropertyOptional()
  achievements?: MemberAchievement[] | undefined;
}

export class CreateMemberBody extends PickType(MemberResponse, [
  "nickname",
  "firstName",
  "lastName",
  "groupId",
  "role",
]) {}

export class UpdateMemberBody extends PartialType(
  OmitType(MemberResponse, ["group", "contacts", "achievements", "id"]),
) {}
