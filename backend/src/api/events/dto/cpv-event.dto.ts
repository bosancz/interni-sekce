import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CPVEventResponse {
	@ApiProperty() name!: string;
	@ApiProperty() dateFrom!: string;
	@ApiProperty() dateTill!: string;
	@ApiPropertyOptional() description?: string;
	@ApiPropertyOptional() link?: string;
}
