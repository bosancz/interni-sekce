import { IsBoolean, IsOptional, IsString } from "class-validator";
import { EnsureBoolean } from "src/helpers/validation";
import { Group } from "src/models/members/entities/group.entity";

export class GroupResponse implements Omit<Group, "members"> {
	id!: number;
	active!: boolean;
	children!: boolean;
	shortName!: string;
	color!: string | null;
	darkColor!: string | null;
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

export class UpdateGroupBody implements Partial<Pick<Group, "shortName" | "name" | "active" | "children">> {
	@IsString() @IsOptional() shortName?: string;
	@IsString() @IsOptional() name?: string | null;
	@IsBoolean() @IsOptional() active?: boolean;
	@IsBoolean() @IsOptional() children?: boolean;
}
