import { ApiProperty } from "@nestjs/swagger";

export class ChangelogResponse {
	@ApiProperty() content!: string;
}
