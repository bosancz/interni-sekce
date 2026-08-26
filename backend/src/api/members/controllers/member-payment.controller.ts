import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	MemberPaymentsCreatePermission,
	MemberPaymentsDeletePermission,
	MemberPaymentsListPermission,
	MemberPaymentsUpdatePermission,
} from "../acl/member-payments.acl";
import { CreatePaymentBody, MemberPaymentResponse, UpdatePaymentBody } from "../dto/member-payment.dto";

@Controller("members/:id/payments")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberPaymentController {
	constructor(private membersRepository: MembersRepository) {}

	@Get()
	@AcLinks(MemberPaymentsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberPaymentResponse), isArray: true })
	async listPayments(@Req() req: Request, @Param("id", ParseIntPipe) memberId: number): Promise<MemberPaymentResponse[]> {
		const member = await this.membersRepository.getMember(memberId, { relations: { payments: true } });
		if (!member) throw new NotFoundException();

		MemberPaymentsListPermission.canOrThrow(req, member);

		return member.payments!;
	}

	@Post()
	@AcLinks(MemberPaymentsCreatePermission)
	@ApiResponse({ type: WithLinks(MemberPaymentResponse) })
	async createPayment(
		@Req() req: Request,
		@Param("id", ParseIntPipe) memberId: number,
		@Body() body: CreatePaymentBody,
	): Promise<MemberPaymentResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberPaymentsCreatePermission.canOrThrow(req, member);

		return this.membersRepository.createPayment(member.id, body);
	}

	@Patch(":paymentId")
	@AcLinks(MemberPaymentsUpdatePermission)
	@ApiResponse({ type: WithLinks(MemberPaymentResponse) })
	async updatePayment(
		@Req() req: Request,
		@Param("id", ParseIntPipe) memberId: number,
		@Param("paymentId", ParseIntPipe) paymentId: number,
		@Body() body: UpdatePaymentBody,
	): Promise<MemberPaymentResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberPaymentsUpdatePermission.canOrThrow(req, member);

		return this.membersRepository.updatePayment(member.id, paymentId, body);
	}

	@Delete(":paymentId")
	@AcLinks(MemberPaymentsDeletePermission)
	@ApiResponse({ type: WithLinks(MemberPaymentResponse) })
	async deletePayment(@Req() req: Request, @Param("id", ParseIntPipe) memberId: number, @Param("paymentId", ParseIntPipe) paymentId: number) {
		const memberPayment = await this.membersRepository.getPayment(memberId, paymentId);
		if (!memberPayment) throw new NotFoundException();

		MemberPaymentsDeletePermission.canOrThrow(req, memberPayment);

		return this.membersRepository.deletePayment(memberId, paymentId);
	}
}
