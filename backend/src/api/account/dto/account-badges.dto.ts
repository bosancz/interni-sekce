import { ApiProperty } from "@nestjs/swagger";
import { BadgeTypes } from "src/models/badges/schema/badge-types";
import { MemberBadgeLevel, MemberBadgeProgress } from "src/models/badges/services/badges.service";

export class BadgeLevelResponse implements MemberBadgeLevel {
	level!: number;
	threshold!: number;
	earnedAt!: Date | null;
	seenAt!: Date | null;
}

export class BadgeResponse implements MemberBadgeProgress {
	@ApiProperty({ enum: BadgeTypes, enumName: "BadgeTypesEnum" }) badge!: BadgeTypes;
	title!: string;
	description!: string;
	unit!: string;
	icon!: string;
	value!: number;
	level!: number;
	@ApiProperty({ type: BadgeLevelResponse, isArray: true }) levels!: BadgeLevelResponse[];
}
