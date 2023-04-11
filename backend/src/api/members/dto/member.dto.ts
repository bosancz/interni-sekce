import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Group } from "src/models/members/entities/group.entity";
import { MemberAchievement } from "src/models/members/entities/member-achievements.entity";
import { MemberContact } from "src/models/members/entities/member-contacts.entity";
import { Member, MemberRank, MemberRole, MembershipStatus } from "src/models/members/entities/member.entity";
import { GroupResponse } from "./group.dto";

export class MemberResponse implements Member {
  @ApiProperty() id!: number;
  @ApiProperty() groupId!: string;

  @ApiPropertyOptional({ type: "boolean" }) active!: boolean;
  @ApiPropertyOptional({ type: "string", enum: MembershipStatus }) membership!: MembershipStatus;
  @ApiPropertyOptional({ type: "string" }) nickname!: string | null;
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

  @ApiPropertyOptional({ type: GroupResponse }) group?: Group | undefined;
  @ApiPropertyOptional() contacts?: MemberContact[] | undefined;
  @ApiPropertyOptional() achievements?: MemberAchievement[] | undefined;
}

export class CreateMemberBody extends OmitType(MemberResponse, ["group", "contacts", "achievements", "id"]) {}

export class UpdateMemberBody extends PartialType(
  OmitType(MemberResponse, ["group", "contacts", "achievements", "id"]),
) {}
