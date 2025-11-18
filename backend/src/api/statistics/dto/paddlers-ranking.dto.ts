import { ApiProperty } from "@nestjs/swagger";

export class PaddlersRankingResponse {
	@ApiProperty() id!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() firstName!: string;
	@ApiProperty() lastName!: string;
	@ApiProperty() groupId!: number;
	@ApiProperty() waterKm!: number;
}
