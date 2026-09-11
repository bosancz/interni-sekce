import { ApiProperty } from "@nestjs/swagger";

export class ChildDaysResponse {
	@ApiProperty() year!: number;

	@ApiProperty() childDays!: number;

	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;
}
