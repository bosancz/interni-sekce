import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListUsersQuery {
  @ApiPropertyOptional() @IsString() @IsOptional() search!: string;
  @ApiPropertyOptional() @IsString() @IsOptional() roles!: string;
}
