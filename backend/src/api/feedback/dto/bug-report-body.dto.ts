import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class BugReportBody {
	@ApiProperty({ description: "Popis chyby, který uživatel zadal." })
	@IsString()
	@MinLength(1)
	@MaxLength(5000)
	description!: string;
}
