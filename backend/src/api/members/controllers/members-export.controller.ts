import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { MembersExportService } from "src/models/members/services/members-export.service";
import { pipeline } from "stream/promises";
import { MembersExportPermission } from "../acl/members.acl";
import { MembersListQuery } from "../dto/member.dto";

@Controller("members/export")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MembersExportController {
	constructor(
		private members: MembersRepository,
		private membersExportService: MembersExportService,
	) {}

	@Get("xlsx")
	@AcLinks(MembersExportPermission)
	@ApiOkResponse({
		schema: {
			type: "string",
			format: "binary",
		},
		content: {
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {},
		},
	})
	async exportMembersXlsx(@Req() req: Request, @Query() query: MembersListQuery, @Res() res: Response) {
		const where = MembersExportPermission.canWhere(req, "members");

		const members = await this.members.getMembers(query, where);
		const xlsx = await this.membersExportService.exportXlsx(members);

		res.setHeader("Content-Disposition", "attachment; filename=" + "bo-databaze.xlsx");
		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

		await pipeline(xlsx, res);
	}
}
