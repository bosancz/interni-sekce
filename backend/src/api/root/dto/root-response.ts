import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RootResponse {
	@ApiProperty() version!: string;
	@ApiProperty() environmentTitle!: string;
	@ApiPropertyOptional() googleClientId?: string;
}
