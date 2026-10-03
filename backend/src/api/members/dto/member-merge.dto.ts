import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt } from "class-validator";
import { MemberMergeFields } from "src/models/members/services/member-merge.service";

export class MemberMergeBody {
	@ApiProperty({ type: "integer" })
	@Type(() => Number)
	@IsInt()
	sourceMemberId!: number;

	@ApiProperty({ enum: MemberMergeFields, enumName: "MemberMergeFieldsEnum", isArray: true })
	@IsArray()
	@IsEnum(MemberMergeFields, { each: true })
	fieldsFromSource!: MemberMergeFields[];
}

export class MemberMergeInfoQuery {
	@ApiProperty({ type: "integer" })
	@Type(() => Number)
	@IsInt()
	sourceMemberId!: number;
}

export class MemberMergeUserResponse {
	@ApiProperty() id!: number;
	@ApiProperty({ type: "string" }) login!: string;
}

export class MemberMergeSideResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() attendeeEvents!: number;
	@ApiProperty() leaderEvents!: number;
	@ApiProperty() photoFaces!: number;
	@ApiProperty() contacts!: number;
	@ApiProperty() achievements!: number;
	@ApiProperty({ type: "integer", isArray: true }) membershipYears!: number[];
	@ApiPropertyOptional({ type: MemberMergeUserResponse, nullable: true }) user!: MemberMergeUserResponse | null;
}

export class MemberMergeInfoResponse {
	@ApiProperty({ type: MemberMergeSideResponse }) target!: MemberMergeSideResponse;
	@ApiProperty({ type: MemberMergeSideResponse }) source!: MemberMergeSideResponse;
	@ApiProperty() sharedEvents!: number;
	@ApiProperty({ type: "integer", isArray: true }) sharedMembershipYears!: number[];
}
