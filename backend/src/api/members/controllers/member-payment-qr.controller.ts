import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Response } from "express";
import { getVariableSymbolMemberId } from "src/helpers/variable-symbol";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { MemberPaymentRequestService } from "src/models/members/services/member-payment-request.service";

/**
 * The QR platba link that goes out in the payment e-mail, redirecting to the image the generator
 * builds (see MemberPaymentRequestService.getQrCodeLinkUrl for why the generator's own URL cannot
 * be put in a mail body).
 *
 * The payment is spelled out in the path and signed there, so the QR still asks for the account
 * and the amount the e-mail named, however the club's settings have moved on since.
 *
 * Unauthenticated, because it is opened by the parent who received the e-mail and who has no
 * account here; the signature in the path is what stands in for one. It sits at the top level
 * rather than under `members/:id` because a member id is not what a recipient is holding — the
 * variable symbol from their payment details is.
 *
 * Not part of the API surface the frontend talks to, so it is left out of the OpenAPI spec and
 * the generated SDK.
 */
@Controller("qr-platba")
@ApiExcludeController()
export class MemberPaymentQrController {
	constructor(
		private readonly members: MembersRepository,
		private readonly paymentRequests: MemberPaymentRequestService,
	) {}

	@Get(":variableSymbol/:accountNumber/:bankCode/:amount/:currency/:signature")
	async getQrPlatbaImage(
		@Param("variableSymbol") variableSymbol: string,
		@Param("accountNumber") accountNumber: string,
		@Param("bankCode") bankCode: string,
		@Param("amount") amount: string,
		@Param("currency") currency: string,
		@Param("signature") signature: string,
		@Res() res: Response,
	): Promise<void> {
		const memberId = getVariableSymbolMemberId(variableSymbol);
		const payment = { variableSymbol, accountNumber, bankCode, amount: Number(amount), currency };

		// The signature covers the whole payment, so nothing in the path can have been edited on
		// the way; the amount has to read back exactly as it was written, so a link is not also
		// reachable as `01500`. Everything that can be wrong with a link answers the same 404 —
		// a malformed amount, a wrong signature, a member who is gone — so a guesser learns
		// nothing about which of them they got wrong.
		if (
			!memberId ||
			!/^\d+$/.test(amount) ||
			String(payment.amount) !== amount ||
			!this.paymentRequests.isQrCodeSignatureValid(payment, signature)
		) {
			throw new NotFoundException();
		}

		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		// Temporary, because the `MSG:` is still built from the member's current name and the
		// generator's URL is nothing this link promises to keep.
		res.redirect(302, this.paymentRequests.getQrCodeImageUrl(member, payment));
	}
}
