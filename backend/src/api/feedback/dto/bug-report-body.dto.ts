import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

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
}
