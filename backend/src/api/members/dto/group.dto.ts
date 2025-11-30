import { IsOptional, IsString } from "class-validator";
import { EnsureBoolean } from "src/helpers/validation";
import { Group } from "src/models/members/entities/group.entity";

export class GroupResponse implements Omit<Group, "members"> {
	id!: number;
	active!: boolean;
	shortName!: string;
	color!: string | null;
	darkColor!: string | null;
	name!: string | null;
	deletedAt!: string | null;
	memberCount?: number;
}

export class ListGroupsQuery {
	@EnsureBoolean() @IsOptional() active?: boolean;
	@EnsureBoolean() @IsOptional() includeMemberCounts?: boolean;
}

export class CreateGroupBody implements Pick<Group, "shortName" | "name"> {
	@IsString() shortName!: string;
	@IsString() @IsOptional() name!: string | null;
}

export class UpdateGroupBody implements Partial<Pick<Group, "shortName" | "name">> {
	@IsString() shortName!: string;
	@IsString() @IsOptional() name!: string | null;
}
