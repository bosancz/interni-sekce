import { ApiProperty } from "@nestjs/swagger";

export class MemberDto {
  @ApiProperty()
  id!: number;
}
