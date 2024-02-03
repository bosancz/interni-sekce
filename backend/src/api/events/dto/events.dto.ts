import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { PaginationQuery } from "src/api/helpers/dto";
import { EnsureBoolean } from "src/utilities/validation";

export class ListEventsQuery extends PaginationQuery {
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() year?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() search?: string;
  @ApiPropertyOptional() @EnsureBoolean() @IsBoolean() @IsOptional() my?: boolean;
  @ApiPropertyOptional() @EnsureBoolean() @IsBoolean() @IsOptional() noleader?: boolean;
}
