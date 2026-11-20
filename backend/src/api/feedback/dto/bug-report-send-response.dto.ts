import { ApiProperty } from "@nestjs/swagger";

export class BugReportSendResponse {
	@ApiProperty({ type: "number", nullable: true }) issueNumber!: number | null;

	@ApiProperty({ type: "string", nullable: true }) issueUrl!: string | null;
}
