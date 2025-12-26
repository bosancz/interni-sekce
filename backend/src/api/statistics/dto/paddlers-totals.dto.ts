import { ApiProperty } from "@nestjs/swagger";

export class PadlersTotalsResponse {
	@ApiProperty({ type: "number", isArray: true }) years!: number[];
}
