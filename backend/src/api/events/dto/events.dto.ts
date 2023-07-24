import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class GetEventsQuery {
  @ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() year?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() search?: string;
}
