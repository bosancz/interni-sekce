import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { AcEntity, WithLinks } from "src/access-control/access-control-lib";
import { PaginationQuery } from "src/api/helpers/dto";
import { Group } from "src/models/members/entities/group.entity";
import { MemberAchievement } from "src/models/members/entities/member-achievements.entity";
import { MemberContact } from "src/models/members/entities/member-contact.entity";
import { Member, MemberRanks, MemberRoles, MembershipStates } from "src/models/members/entities/member.entity";
import { EnsureArray } from "src/utilities/validation";
import { GroupResponse } from "./group.dto";

export class MemberResponse implements Member {
  @ApiProperty() id!: number;
  @ApiProperty() groupId!: number;
  @ApiProperty({ type: "string" }) nickname!: string;
  @ApiProperty({ type: "enum", enum: MemberRoles, enumName: "MemberRolesEnum" }) role!: MemberRoles;
  @ApiProperty({ type: "boolean" }) active!: boolean;
  @ApiProperty({ type: "string", enum: MembershipStates, enumName: "MembershipStatesEnum" })
  membership!: MembershipStates;

  @ApiPropertyOptional({ type: "string" }) function?: string | null;
  @ApiPropertyOptional({ type: "string" }) firstName?: string | null;
  @ApiPropertyOptional({ type: "string" }) lastName?: string | null;
  @ApiPropertyOptional({ type: "string" }) birthday?: string | null;
  @ApiPropertyOptional({ type: "string" }) addressStreet?: string | null;
  @ApiPropertyOptional({ type: "string" }) addressStreetNo?: string | null;
  @ApiPropertyOptional({ type: "string" }) addressCity?: string | null;
  @ApiPropertyOptional({ type: "string" }) addressPostalCode?: string | null;
  @ApiPropertyOptional({ type: "string" }) addressCountry?: string | null;
  @ApiPropertyOptional({ type: "string" }) mobile?: string | null;
  @ApiPropertyOptional({ type: "string" }) email?: string | null;
  @ApiPropertyOptional({ type: "enum", enum: MemberRanks, enumName: "MemberRanksEnum" }) rank?: MemberRanks | null;
  @ApiPropertyOptional({ type: "string" }) knownProblems?: string | null;
  @ApiPropertyOptional({ type: "string" }) allergies?: string | null;
  @ApiPropertyOptional({ type: "string" }) insuranceCardFile?: string | null;

  @AcEntity(GroupResponse)
  @ApiPropertyOptional({ type: WithLinks(GroupResponse) })
  group?: Group | undefined;

  @ApiPropertyOptional()
  contacts?: MemberContact[] | undefined;

  @ApiPropertyOptional()
  achievements?: MemberAchievement[] | undefined;
}

export class MemberCreateBody
  implements Pick<MemberResponse, "nickname" | "firstName" | "lastName" | "groupId" | "role">
{
  @ApiProperty() @Type(() => Number) @IsNumber() groupId!: number;
  @ApiProperty() @IsString() nickname!: string;
  @ApiProperty() @IsString() role!: MemberRoles;
  @ApiProperty() @IsString() @IsOptional() firstName!: string | null;
  @ApiProperty() @IsString() @IsOptional() lastName!: string | null;
}

export class MemberUpdateBody extends PartialType(
  OmitType(MemberResponse, ["group", "contacts", "achievements", "id"]),
) {}

export class MembersListQuery extends PaginationQuery {
  @ApiPropertyOptional() @IsNumber() @IsOptional() group?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() search?: string;
  @ApiPropertyOptional() @EnsureArray() @IsEnum(MemberRoles, { each: true }) @IsOptional() roles?: MemberRoles[];
  @ApiPropertyOptional() @IsEnum(MembershipStates) @IsOptional() membership?: MembershipStates;
}
