import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { MemberContact } from "src/models/members/entities/member-contact.entity";

export class MemberContactResponse implements MemberContact {
	@ApiProperty() id!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty() relationship!: string;

	@ApiPropertyOptional() name?: string;
	@ApiPropertyOptional() mobile?: string;
	@ApiPropertyOptional() email?: string;
	@ApiPropertyOptional() other?: string;
}

export class CreateContactBody {
	@ApiProperty() @IsString() relationship!: string;

	@ApiPropertyOptional() @IsString() @IsOptional() name?: string;
	@ApiPropertyOptional() @IsString() @IsOptional() mobile?: string;
	@ApiPropertyOptional() @IsString() @IsOptional() email?: string;
	@ApiPropertyOptional() @IsString() @IsOptional() other?: string;
}

export class UpdateContactBody extends CreateContactBody {}
