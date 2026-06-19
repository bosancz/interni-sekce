import { ApiProperty } from "@nestjs/swagger";

export class RegistrationTemplateResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;
}
