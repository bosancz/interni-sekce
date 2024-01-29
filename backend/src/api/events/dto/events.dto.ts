import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { PaginationQuery } from "src/api/helpers/dto";

export class GetEventsQuery extends PaginationQuery {
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() year?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() search?: string;
  @ApiPropertyOptional() @Type(() => Boolean) @IsBoolean() @IsOptional() my?: boolean;
  @ApiPropertyOptional() @Type(() => Boolean) @IsBoolean() @IsOptional() noleader?: boolean;
}
