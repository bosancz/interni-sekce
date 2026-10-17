import { ApiProperty } from "@nestjs/swagger";

export class MemberInsuranceCardUploadResponse {
	@ApiProperty({ type: "string", nullable: true }) recognizedExpiration!: string | null;
}
