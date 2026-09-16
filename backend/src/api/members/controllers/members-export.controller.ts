import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { currentMembershipYear } from "src/helpers/membership";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { MembersExportService } from "src/models/members/services/members-export.service";
import { pipeline } from "stream/promises";
import { MembershipExportPermission, MembersExportPermission } from "../acl/members.acl";
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

		const members = await this.members.getMembers({ ...query, withGroup: true }, where);
		const xlsx = await this.membersExportService.exportXlsx(members);

		res.setHeader("Content-Disposition", "attachment; filename=" + "bo-databaze.xlsx");
		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

		await pipeline(xlsx, res);
	}

	/**
	 * The treasurer view as a sheet — the same members the page lists, so it takes the page's own
	 * filters, and the columns it shows by default. The season is `membershipYear`, the year the
	 * page is on.
	 */
	@Get("membership-xlsx")
	@AcLinks(MembershipExportPermission)
	@ApiOkResponse({
		schema: {
			type: "string",
			format: "binary",
		},
		content: {
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {},
		},
	})
	async exportMembershipXlsx(@Req() req: Request, @Query() query: MembersListQuery, @Res() res: Response) {
		const where = MembershipExportPermission.canWhere(req, "members");

		const year = query.membershipYear ?? currentMembershipYear();
		const members = await this.members.getMembers({ ...query, withGroup: true }, where);
		const xlsx = await this.membersExportService.exportMembershipXlsx(members, year);

		res.setHeader("Content-Disposition", `attachment; filename=prispevky-${year}.xlsx`);
		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

		await pipeline(xlsx, res);
	}
}
