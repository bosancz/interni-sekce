import { Controller, Get, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { ProgramIcalService } from "../services/program-ical.service";

@Controller("program")
@ApiTags("Public API")
export class ProgramIcalLegacyController {
	constructor(private readonly programIcal: ProgramIcalService) {}

	@Get("ical")
	@ApiOperation({
		deprecated: true,
		summary: "Deprecated: use GET /api/public/program/ical instead.",
		description:
			"The old server's iCalendar feed URL, kept so calendar apps subscribed to it keep working. Serves the same feed as GET /api/public/program/ical.",
	})
	@ApiProduces("text/calendar")
	@ApiResponse({ status: 200, description: "iCalendar feed of the public program.", type: String })
	async getLegacyProgramIcal(@Res() res: Response): Promise<void> {
		await this.programIcal.sendProgramIcal(res);
	}
}
