import { Controller, Get, Res } from "@nestjs/common";
import { ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { ProgramIcalService } from "../services/program-ical.service";

@Controller(["public/v2/program", "public/program", "program"])
@ApiTags("Public API")
export class ProgramIcalController {
	constructor(private readonly programIcal: ProgramIcalService) {}

	@Get("ical")
	@ApiProduces("text/calendar")
	@ApiResponse({ status: 200, description: "iCalendar feed of the public program.", type: String })
	async getProgramIcal(@Res() res: Response): Promise<void> {
		await this.programIcal.sendProgramIcal(res);
	}
}
