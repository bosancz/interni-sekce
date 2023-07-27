import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { MemberContact, MemberContactTypes } from "src/models/members/entities/member-contact.entity";

export class MemberContactResponse implements MemberContact {
  @ApiProperty() id!: number;
  @ApiProperty() memberId!: number;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: MemberContactTypes, enumName: "MemberContactTypesEnum" }) type!: MemberContactTypes;
  @ApiProperty() contact!: string;
}

export class CreateContactBody {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsEnum(MemberContactTypes) type!: MemberContactTypes;
  @ApiProperty() @IsString() contact!: string;
}
