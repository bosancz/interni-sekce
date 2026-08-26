import { Controller, Get, NotFoundException, Param, ParseIntPipe, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { MemberPaymentRequestService } from "src/models/members/services/member-payment-request.service";
import { MemberPaymentRequestPermission } from "../acl/member-payment-request.acl";
import { MemberPaymentRequestResponse } from "../dto/member-payment-request.dto";

@Controller("members/:id/payment-request")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberPaymentRequestController {
	constructor(
		private readonly members: MembersRepository,
		private readonly paymentRequests: MemberPaymentRequestService,
	) {}

	@Get()
	@AcLinks(MemberPaymentRequestPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberPaymentRequestResponse) })
	async getMemberPaymentRequest(
		@Req() req: Request,
		@Param("id", ParseIntPipe) memberId: number,
	): Promise<MemberPaymentRequestResponse> {
		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberPaymentRequestPermission.canOrThrow(req, member);

		return this.paymentRequests.getPaymentRequest(member);
	}
}
