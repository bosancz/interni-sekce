import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
	ArrayNotEmpty,
	ArrayUnique,
	IsArray,
	IsDateString,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateIf,
} from "class-validator";
import { MemberTraining, MemberTrainingTypes } from "src/models/members/entities/member-training.entity";

const TrimToNull = () => Transform(({ value }) => (typeof value === "string" ? value.trim() || null : (value ?? null)));

export class MemberTrainingResponse implements MemberTraining {
	@ApiProperty() id!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty({ enum: MemberTrainingTypes, enumName: "MemberTrainingTypesEnum" }) type!: MemberTrainingTypes;
	@ApiProperty({ type: "string", nullable: true }) name!: string | null;
	@ApiProperty({ type: "string", format: "date", nullable: true }) issuedOn!: string | null;
	@ApiProperty({ type: "string", format: "date", nullable: true }) validUntil!: string | null;
	@ApiProperty({ type: "string", nullable: true }) issuer!: string | null;
}

export class MemberTrainingUpdateBody {
	@ApiPropertyOptional({ type: "string", nullable: true })
	@TrimToNull()
	@IsString()
	@IsOptional()
	name?: string | null;

	@ApiPropertyOptional({ type: "string", format: "date", nullable: true })
	@TrimToNull()
	@IsDateString()
	@IsOptional()
	issuedOn?: string | null;

	@ApiPropertyOptional({ type: "string", format: "date", nullable: true })
	@TrimToNull()
	@IsDateString()
	@IsOptional()
	validUntil?: string | null;

	@ApiPropertyOptional({ type: "string", nullable: true })
	@TrimToNull()
	@IsString()
	@IsOptional()
	issuer?: string | null;
}

export class MemberTrainingCreateBody extends MemberTrainingUpdateBody {
	@ApiProperty({ enum: MemberTrainingTypes, enumName: "MemberTrainingTypesEnum" })
	@IsEnum(MemberTrainingTypes)
	type!: MemberTrainingTypes;

	@ApiPropertyOptional({ type: "string", nullable: true })
	@TrimToNull()
	@ValidateIf((body: MemberTrainingCreateBody) => body.type === MemberTrainingTypes.custom || body.name != null)
	@IsString()
	@IsNotEmpty()
	declare name?: string | null;
}

export class MemberTrainingsBulkCreateBody extends MemberTrainingCreateBody {
	@ApiProperty({ type: "integer", isArray: true })
	@IsArray()
	@ArrayNotEmpty()
	@ArrayUnique()
	@IsInt({ each: true })
	memberIds!: number[];
}
