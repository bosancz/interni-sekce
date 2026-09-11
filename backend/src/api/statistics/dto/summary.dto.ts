import { ApiProperty } from "@nestjs/swagger";

export class SummaryResponse {
	@ApiProperty() year!: number;

	@ApiProperty() activeChildren!: number;
	@ApiProperty() activeLeaders!: number;
	@ApiProperty() childDays!: number;

	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;
}
