import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { MemberAchievement, MemberAchievementTypes } from "src/models/members/entities/member-achievements.entity";

export class MemberAchievementResponse implements MemberAchievement {
	@ApiProperty() id!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty({ enum: MemberAchievementTypes, enumName: "MemberAchievementTypesEnum" })
	type!: MemberAchievementTypes;
	@ApiProperty({ type: "string", format: "date" }) date!: string;
}

export class MemberAchievementCreateBody {
	@ApiProperty({ enum: MemberAchievementTypes, enumName: "MemberAchievementTypesEnum" })
	@IsEnum(MemberAchievementTypes)
	type!: MemberAchievementTypes;

	@ApiProperty({ type: "string", format: "date" }) @IsDateString() date!: string;
}

export class MemberAchievementUpdateBody {
	@ApiPropertyOptional({ type: "string", format: "date" }) @IsDateString() @IsOptional() date?: string;
}
