import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { PaginationQuery } from "src/api/helpers/dto";
import { EnsureArray, EnsureBoolean } from "src/helpers/validation";
import { ProgramExportFormats } from "src/models/events/services/events-program-export.service";

export class ListEventsQuery extends PaginationQuery {
	@EnsureArray({ split: "," })
	@Type(() => Number)
	@IsNumber({}, { each: true })
	@IsOptional()
	year?: number[];

	@IsDateString() @IsOptional() dateFrom?: string;
	@IsDateString() @IsOptional() dateTill?: string;

	@EnsureArray({ split: "," })
	@IsString({ each: true })
	@IsOptional()
	status?: string[];

	@IsString() @IsOptional() search?: string;
	@EnsureBoolean() @IsBoolean() @IsOptional() my?: boolean;
	@EnsureBoolean() @IsBoolean() @IsOptional() noleader?: boolean;
	@EnsureBoolean() @IsBoolean() @IsOptional() deleted?: boolean;
}

export class ProgramExportQuery extends ListEventsQuery {
	@ApiProperty({ enum: ProgramExportFormats, enumName: "ProgramExportFormats" })
	@IsEnum(ProgramExportFormats)
	format!: ProgramExportFormats;
}
