import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";
import { EnsureBoolean, EnsureStringArray } from "src/helpers/validation";
import { MemberContact } from "src/models/members/entities/member-contact.entity";

export class MemberContactResponse implements MemberContact {
	@ApiProperty() id!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty() relationship!: string;
	@ApiProperty({ type: "string", isArray: true }) mobile!: string[];
	@ApiProperty({ type: "string", isArray: true }) email!: string[];
	@ApiProperty({ type: "boolean" }) isDefault!: boolean;

	@ApiPropertyOptional() name?: string;
	@ApiPropertyOptional() other?: string;
}

export class CreateContactBody {
	@ApiProperty() @IsString() relationship!: string;

	@ApiPropertyOptional() @IsString() @IsOptional() name?: string;

	@ApiPropertyOptional({ type: "string", isArray: true })
	@EnsureStringArray()
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	mobile?: string[];

	@ApiPropertyOptional({ type: "string", isArray: true })
	@EnsureStringArray()
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	email?: string[];

	@ApiPropertyOptional() @IsString() @IsOptional() other?: string;

	@ApiPropertyOptional({ type: "boolean" }) @EnsureBoolean() @IsBoolean() @IsOptional() isDefault?: boolean;
}

export class UpdateContactBody extends CreateContactBody {}
