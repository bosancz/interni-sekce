import { ApiProperty } from "@nestjs/swagger";

export class RegistrationPreviewResponse {
	@ApiProperty({ description: "PDF přihlášky v base64" })
	pdf!: string;

	@ApiProperty({ description: "Náhled přihlášky jako JPEG v base64" })
	image!: string;
}
