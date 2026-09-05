import { Body, Controller, NotFoundException, Param, ParseIntPipe, Patch, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { MembershipPaymentService } from "src/models/members/services/membership-payment.service";
import { MemberMembershipUpdatePermission } from "../acl/members.acl";
import { MemberMembershipUpdateBody } from "../dto/member-membership.dto";
import { MembershipPaymentResponse } from "../dto/membership-payment.dto";

/**
 * The single way the membership fee is written — see MemberMembershipUpdatePermission for why it
 * is separate from the general member update.
 */
@Controller("members/:id/membership")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberMembershipController {
	constructor(
		private readonly members: MembersRepository,
		private readonly membershipPayments: MembershipPaymentService,
	) {}

	@Patch()
	@AcLinks(MemberMembershipUpdatePermission)
	@ApiResponse({ status: 200, type: MembershipPaymentResponse, isArray: true })
	async updateMemberMembership(
		@Req() req: Request,
		@Param("id", ParseIntPipe) id: number,
		@Body() body: MemberMembershipUpdateBody,
	): Promise<MembershipPaymentResponse[]> {
		const member = await this.members.getMember(id);
		if (!member) throw new NotFoundException();

		MemberMembershipUpdatePermission.canOrThrow(req, member);

		// Only the given year changes: "zaplaceno" records a payment for it, "nezaplaceno" removes
		// the one that is there. The other seasons' payments are left untouched.
		if (body.paid) await this.membershipPayments.setPaid(member, body.year);
		else await this.membershipPayments.setUnpaid(member, body.year);

		// The whole list comes back so a caller (the treasurer view above all) can show the payment
		// exactly as it was recorded — symbol and date included — without a second request.
		return this.membershipPayments.getMembership(member);
	}
}
