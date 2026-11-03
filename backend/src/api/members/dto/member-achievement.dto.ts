import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { MemberAchievement, MemberAchievementTypes } from "src/models/members/entities/member-achievements.entity";

export class MemberAchievementResponse implements MemberAchievement {
	@ApiProperty() id!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty({ enum: MemberAchievementTypes, enumName: "MemberAchievementTypesEnum" })
	type!: MemberAchievementTypes;
}

export class MemberAchievementCreateBody {
	@ApiProperty({ enum: MemberAchievementTypes, enumName: "MemberAchievementTypesEnum" })
	@IsEnum(MemberAchievementTypes)
	type!: MemberAchievementTypes;
}
