import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from "class-validator";
import { BugReportDisplayModes } from "src/models/bug-reports/schema/bug-report-display-modes";
import { BugReportPointerTypes } from "src/models/bug-reports/schema/bug-report-pointer-types";

export class BugReportElementBody {
	@ApiPropertyOptional({ description: "CSS selektor označeného prvku stránky." })
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	selector?: string;

	@ApiPropertyOptional({ description: "Komponenty aplikace, ve kterých označený prvek leží, od vnější." })
	@IsOptional()
	@IsString()
	@MaxLength(1000)
	components?: string;

	@ApiPropertyOptional({ description: "Text označeného prvku." })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	text?: string;

	@ApiPropertyOptional({ description: "Poloha a velikost označeného prvku v okně (CSS px)." })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	rect?: string;
}

export class BugReportBody {
	@ApiProperty({ description: "Popis chyby, který uživatel zadal." })
	@IsString()
	@MinLength(1)
	@MaxLength(5000)
	description!: string;

	@ApiPropertyOptional({ description: "Adresa stránky, na které se uživatel nacházel." })
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	url?: string;

	@ApiPropertyOptional({ description: "Verze frontendu, ze které se chyba hlásí." })
	@IsOptional()
	@IsString()
	@MaxLength(100)
	frontendVersion?: string;

	@ApiPropertyOptional({ description: "Šířka obrazovky v CSS pixelech." })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100000)
	screenWidth?: number;

	@ApiPropertyOptional({ description: "Výška obrazovky v CSS pixelech." })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100000)
	screenHeight?: number;

	@ApiPropertyOptional({ description: "Počet fyzických pixelů na jeden CSS pixel." })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(0.1)
	@Max(10)
	pixelRatio?: number;

	@ApiPropertyOptional({ description: "Šířka okna aplikace v CSS pixelech." })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100000)
	viewportWidth?: number;

	@ApiPropertyOptional({ description: "Výška okna aplikace v CSS pixelech." })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100000)
	viewportHeight?: number;

	@ApiPropertyOptional({
		enum: BugReportDisplayModes,
		enumName: "BugReportDisplayModesEnum",
		description: "Režim zobrazení aplikace.",
	})
	@IsOptional()
	@IsEnum(BugReportDisplayModes)
	displayMode?: BugReportDisplayModes;

	@ApiPropertyOptional({
		enum: BugReportPointerTypes,
		enumName: "BugReportPointerTypesEnum",
		description: "Ukazovací zařízení, která má zařízení k dispozici.",
	})
	@IsOptional()
	@IsEnum(BugReportPointerTypes)
	pointer?: BugReportPointerTypes;

	@ApiPropertyOptional({ type: BugReportElementBody, description: "Prvek stránky, který uživatel označil." })
	@IsOptional()
	@ValidateNested()
	@Type(() => BugReportElementBody)
	element?: BugReportElementBody;
}
