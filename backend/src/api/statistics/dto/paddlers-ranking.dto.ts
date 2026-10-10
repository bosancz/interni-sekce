import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PaddlersSummaryResponse {
	@ApiProperty() year!: number;

	@ApiProperty() riversCount!: number;
	@ApiProperty() eventsCount!: number;
	@ApiProperty() waterKm!: number;

	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;
}

export class PaddlerResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() groupId!: number;

	@ApiProperty() waterKm!: number;
	@ApiProperty() eventsCount!: number;
	@ApiProperty() riversCount!: number;

	@ApiProperty() rank!: number;

	@ApiPropertyOptional({ type: "string" }) firstName?: string | null;
	@ApiPropertyOptional({ type: "string" }) lastName?: string | null;
}

export class PaddlersRankingResponse {
	@ApiProperty() year!: number;

	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;

	@ApiProperty({ type: PaddlerResponse, isArray: true }) children!: PaddlerResponse[];
	@ApiProperty({ type: PaddlerResponse, isArray: true }) leaders!: PaddlerResponse[];
}
