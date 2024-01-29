import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class PaginationQuery {
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() limit?: number;
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() offset?: number;
}
