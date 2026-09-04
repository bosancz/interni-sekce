import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { PaginationQuery } from "src/api/helpers/dto";
import { MembershipPaymentStates } from "src/helpers/membership";
import { EnsureArray, EnsureBoolean } from "src/helpers/validation";
import { MemberAchievement } from "src/models/members/entities/member-achievements.entity";
import { MemberContact } from "src/models/members/entities/member-contact.entity";
import { MembershipPayment } from "src/models/members/entities/membership-payment.entity";
import {
	HealthEntry,
	HealthSeverity,
	Member,
	MemberRanks,
	MemberRoles,
} from "src/models/members/entities/member.entity";
import { MembershipPaymentResponse } from "./membership-payment.dto";

export class HealthEntryDto implements HealthEntry {
	@ApiProperty({ type: "string" }) @IsString() name!: string;
	@ApiProperty({ type: "string", enum: HealthSeverity, enumName: "HealthSeverityEnum" })
	@IsEnum(HealthSeverity)
	severity!: HealthSeverity;
}

export class MemberResponse implements Member {
	@ApiProperty() id!: number;
	@ApiProperty() groupId!: number;
	@ApiProperty({ type: "string" }) nickname!: string;
	@ApiProperty({ type: "string", enum: MemberRoles, enumName: "MemberRolesEnum" }) role!: MemberRoles;
	@ApiProperty({ type: "boolean" }) active!: boolean;
	// The fees the member has paid, one per season (see helpers/membership.ts); ask
	// isMembershipPaid() about a year rather than searching the list. Written only through
	// PATCH /members/:id/membership, so no update body carries it.
	@ApiPropertyOptional({ type: MembershipPaymentResponse, isArray: true })
	membership?: MembershipPayment[];

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
	@ApiPropertyOptional({ type: "string", enum: MemberRanks, enumName: "MemberRanksEnum" }) rank?: MemberRanks | null;
	@ApiPropertyOptional({ type: HealthEntryDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => HealthEntryDto)
	knownProblems?: HealthEntryDto[] | null;

	@ApiPropertyOptional({ type: HealthEntryDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => HealthEntryDto)
	allergies?: HealthEntryDto[] | null;
	@ApiPropertyOptional({ type: "string" }) insuranceCardFile?: string | null;

	// Soft-delete timestamp: null for live members, set for members shown on the deleted-members page.
	@ApiPropertyOptional({ type: "string" }) deletedAt?: Date;

	// @AcEntity(GroupResponse)
	// @ApiPropertyOptional({ type: WithLinks(GroupResponse) })
	// group?: Group | undefined;

	@ApiPropertyOptional()
	contacts?: MemberContact[] | undefined;

	@ApiPropertyOptional()
	achievements?: MemberAchievement[] | undefined;
}

export class MemberCreateBody implements Pick<
	MemberResponse,
	"nickname" | "firstName" | "lastName" | "groupId" | "role"
> {
	@ApiProperty() @Type(() => Number) @IsNumber() groupId!: number;
	@ApiProperty() @IsString() nickname!: string;
	@ApiProperty() @IsString() role!: MemberRoles;
	@ApiProperty() @IsString() @IsOptional() firstName!: string | null;
	@ApiProperty() @IsString() @IsOptional() lastName!: string | null;
}

export class MemberUpdateBody extends PartialType(
	OmitType(MemberResponse, ["contacts", "achievements", "id", "membership"]),
) {}

export class MembersListQuery extends PaginationQuery {
	@EnsureArray({ split: "," })
	@Type(() => Number, {})
	@IsNumber({}, { each: true })
	@IsOptional()
	groups?: number[];

	@IsString() @IsOptional() search?: string;
	@EnsureArray({ split: "," })
	@IsEnum(MemberRoles, { each: true })
	@IsOptional()
	roles?: MemberRoles[];

	// Filters on the membership of `membershipYear`, not on the whole list.
	@ApiPropertyOptional({
		enum: MembershipPaymentStates,
		enumName: "MembershipPaymentStatesEnum",
		isArray: true,
	})
	@EnsureArray({ split: "," })
	@IsEnum(MembershipPaymentStates, { each: true })
	@IsOptional()
	membership?: MembershipPaymentStates[];

	@EnsureArray({ split: "," })
	@Type(() => Number, {})
	@IsNumber({}, { each: true })
	@IsOptional()
	age?: number[];

	/** Which year the membership filter and the membership sort look at. Defaults to the current one. */
	@ApiPropertyOptional({ type: "number" })
	@Type(() => Number)
	@IsInt()
	@Min(1900)
	@Max(2200)
	@IsOptional()
	membershipYear?: number;

	@EnsureBoolean() @IsOptional() active?: boolean;

	@ApiPropertyOptional({ type: "boolean" })
	@EnsureBoolean()
	@IsOptional()
	contacts?: boolean;
}
