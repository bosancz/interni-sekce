import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, Min, ValidateIf } from "class-validator";
import { GroupMembership } from "src/models/members/entities/group-membership.entity";

export class GroupMembershipResponse implements GroupMembership {
	@ApiProperty() id!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty() groupId!: number;
	@ApiProperty({ type: "integer", nullable: true }) yearFrom!: number | null;
	@ApiProperty({ type: "integer", nullable: true }) yearTill!: number | null;
	@ApiProperty() active!: boolean;
}

export class GroupMembershipUpdateBody {
	@ApiPropertyOptional({ type: "integer" }) @Type(() => Number) @IsInt() @IsOptional() groupId?: number;

	@ApiPropertyOptional({ type: "integer", nullable: true })
	@ValidateIf((body: GroupMembershipUpdateBody) => body.yearFrom !== null)
	@Type(() => Number)
	@IsInt()
	@Min(1900)
	@Max(2200)
	@IsOptional()
	yearFrom?: number | null;

	@ApiPropertyOptional({ type: "integer", nullable: true })
	@ValidateIf((body: GroupMembershipUpdateBody) => body.yearTill !== null)
	@Type(() => Number)
	@IsInt()
	@Min(1900)
	@Max(2200)
	@IsOptional()
	yearTill?: number | null;

	@ApiPropertyOptional() @IsBoolean() @IsOptional() active?: boolean;
}

export class GroupMembershipCreateBody extends GroupMembershipUpdateBody {
	@ApiProperty({ type: "integer" }) @Type(() => Number) @IsInt() declare groupId: number;
}
