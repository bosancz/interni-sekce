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
 * Unauthenticated, because it is opened by the parent who received the e-mail and who has no
 * account here; the signature in the path is what stands in for one. It sits at the top level
 * rather than under `members/:id` both to keep the mailed URL short and because a member id is
 * not what a recipient is holding — the variable symbol from their payment details is.
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

	@Get(":variableSymbol/:signature")
	async getQrPlatbaImage(
		@Param("variableSymbol") variableSymbol: string,
		@Param("signature") signature: string,
		@Res() res: Response,
	): Promise<void> {
		const memberId = getVariableSymbolMemberId(variableSymbol);

		// the same 404 for a malformed symbol, a wrong signature and a member who is gone, so a
		// guesser learns nothing about which of the three they got wrong
		if (!memberId || !this.paymentRequests.isQrCodeSignatureValid(variableSymbol, signature)) {
			throw new NotFoundException();
		}

		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		// A temporary redirect: the target is rebuilt from the current payment settings on every
		// open, so a link mailed last season still pays to the account the club uses today.
		res.redirect(302, await this.paymentRequests.getQrCodeImageUrl(member, variableSymbol));
	}
}
