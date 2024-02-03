import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { MemberContact } from "src/models/members/entities/member-contact.entity";

export class MemberContactResponse implements MemberContact {
  @ApiProperty() id!: number;
  @ApiProperty() memberId!: number;
  @ApiProperty() title!: string;

  @ApiPropertyOptional() mobile?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() other?: string;
}

export class CreateContactBody {
  @ApiProperty() @IsString() title!: string;

  @ApiPropertyOptional() @IsString() @IsOptional() mobile?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() other?: string;
}
