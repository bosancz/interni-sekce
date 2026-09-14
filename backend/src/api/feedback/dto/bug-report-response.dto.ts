import { ApiProperty } from "@nestjs/swagger";
import { BugReportStates } from "src/models/bug-reports/schema/bug-report-states";

export class BugReportResponse {
	id!: number;
	issueNumber!: number;
	title!: string;
	url!: string;

	@ApiProperty({ enum: BugReportStates, enumName: "BugReportStatesEnum" }) state!: BugReportStates;

	@ApiProperty({ type: "string", nullable: true }) releasedVersion!: string | null;

	createdAt!: Date;

	@ApiProperty({ type: "string", format: "date-time", nullable: true }) notifiedAt!: Date | null;
}
