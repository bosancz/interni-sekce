import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { MemberContact, MemberContactType } from "src/models/members/entities/member-contact.entity";

export class MemberContactResponse implements MemberContact {
  @ApiProperty() id!: number;
  @ApiProperty() memberId!: number;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: MemberContactType }) type!: MemberContactType;
  @ApiProperty() contact!: string;
}

export class CreateContactBody {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsEnum(MemberContactType) type!: MemberContactType;
  @ApiProperty() @IsString() contact!: string;
}
