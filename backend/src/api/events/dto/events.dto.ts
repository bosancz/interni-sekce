import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class GetEventsQuery {
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() year?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() search?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() my?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() noleader?: boolean;
}
