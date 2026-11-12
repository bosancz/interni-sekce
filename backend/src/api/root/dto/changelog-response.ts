import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { EnsureArray } from "src/helpers/validation";

export class ChangelogQuery {
	@ApiPropertyOptional({ type: "number" })
	@Type(() => Number)
	@IsInt()
	@Min(0)
	@IsOptional()
	offset?: number;

	@ApiPropertyOptional({ type: "string", isArray: true })
	@EnsureArray({ split: "," })
	@IsString({ each: true })
	@IsOptional()
	types?: string[];
}

export class ChangelogTypeCountResponse {
	@ApiProperty() type!: string;
	@ApiProperty() count!: number;
}

export class ChangelogResponse {
	@ApiProperty() content!: string;
	@ApiProperty({ type: "number", nullable: true }) nextOffset!: number | null;
	@ApiProperty({ type: ChangelogTypeCountResponse, isArray: true }) types!: ChangelogTypeCountResponse[];
}
