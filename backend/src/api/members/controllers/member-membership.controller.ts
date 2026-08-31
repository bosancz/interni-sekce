import { Body, Controller, NotFoundException, Param, ParseIntPipe, Patch, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { setMembershipPaid } from "src/helpers/membership";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { MemberMembershipUpdatePermission } from "../acl/members.acl";
import { MemberMembershipUpdateBody } from "../dto/member-membership.dto";

/**
 * The single way the membership fee is written — see MemberMembershipUpdatePermission for why it
 * is separate from the general member update.
 */
@Controller("members/:id/membership")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberMembershipController {
	constructor(private readonly members: MembersRepository) {}

	@Patch()
	@AcLinks(MemberMembershipUpdatePermission)
	@ApiResponse({ status: 204 })
	async updateMemberMembership(
		@Req() req: Request,
		@Param("id", ParseIntPipe) id: number,
		@Body() body: MemberMembershipUpdateBody,
	): Promise<void> {
		const member = await this.members.getMember(id);
		if (!member) throw new NotFoundException();

		MemberMembershipUpdatePermission.canOrThrow(req, member);

		// Only the given year changes; the rest of the list is kept as it is stored.
		await this.members.updateMember(id, {
			membership: setMembershipPaid(member.membership, body.paid, body.year),
		});
	}
}
