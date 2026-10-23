import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsHexColor, IsInt, IsOptional, IsString, ValidateIf } from "class-validator";
import { EnsureBoolean } from "src/helpers/validation";
import { Group, GroupMeetingDays } from "src/models/members/entities/group.entity";

export class GroupLeaderResponse {
	@ApiProperty() id!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty({ type: "string", nullable: true, required: false }) firstName?: string | null;
	@ApiProperty({ type: "string", nullable: true, required: false }) lastName?: string | null;
	@ApiProperty({ type: "string", nullable: true, required: false }) profilePhotoUpdatedAt?: Date | null;
}

export class GroupResponse implements Omit<Group, "members" | "leader"> {
	id!: number;
	active!: boolean;
	children!: boolean;
	shortName!: string;
	color!: string | null;
	darkColor!: string | null;
	@ApiProperty({ type: "string", nullable: true }) profilePhotoUpdatedAt!: Date | null;
	@ApiProperty({ enum: GroupMeetingDays, enumName: "GroupMeetingDaysEnum", nullable: true })
	meetingDay!: GroupMeetingDays | null;
	@ApiProperty({ type: "number", nullable: true }) leaderId!: number | null;
	@ApiProperty({ type: GroupLeaderResponse, nullable: true, required: false }) leader?: GroupLeaderResponse | null;
	name!: string | null;
	deletedAt!: string | null;
	childrenCount?: number;
	leadersCount?: number;
}

export class ListGroupsQuery {
	@EnsureBoolean() @IsOptional() active?: boolean;
	@EnsureBoolean() @IsOptional() includeMemberCounts?: boolean;
	@EnsureBoolean() @IsOptional() includeDeleted?: boolean;
}

export class CreateGroupBody implements Pick<Group, "shortName" | "name"> {
	@IsString() shortName!: string;
	@IsString() @IsOptional() name!: string | null;
}

export class UpdateGroupBody implements Partial<
	Pick<Group, "shortName" | "name" | "active" | "children" | "color" | "meetingDay" | "leaderId">
> {
	@IsString() @IsOptional() shortName?: string;
	@IsString() @IsOptional() name?: string | null;
	@IsBoolean() @IsOptional() active?: boolean;
	@IsBoolean() @IsOptional() children?: boolean;
	@ApiProperty({ type: "string", nullable: true, required: false })
	@ValidateIf((_, value) => value !== null)
	@IsHexColor()
	@IsOptional()
	color?: string | null;
	@ApiProperty({ enum: GroupMeetingDays, enumName: "GroupMeetingDaysEnum", nullable: true, required: false })
	@ValidateIf((_, value) => value !== null)
	@IsEnum(GroupMeetingDays)
	@IsOptional()
	meetingDay?: GroupMeetingDays | null;
	@ApiProperty({ type: "number", nullable: true, required: false })
	@ValidateIf((_, value) => value !== null)
	@IsInt()
	@IsOptional()
	leaderId?: number | null;
}
