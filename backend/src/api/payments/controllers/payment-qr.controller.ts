import { Controller, Get, Header, NotFoundException, Param, StreamableFile } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { AcController } from "src/access-control/access-control-lib";
import { MemberPaymentRequestService } from "src/models/members/services/member-payment-request.service";

/**
 * Session-less QR code image for a membership fee payment.
 *
 * Deliberately unauthenticated: the link is mailed to parents, who have no account here, so a
 * login wall would make the QR unreachable. The `:code` path parameter is the variable symbol
 * plus an HMAC of it (see {@link MemberPaymentRequestService.getQrCodeUrl}), so the images
 * cannot be enumerated by walking member ids, and the image itself shows nothing the payment
 * e-mail does not already spell out.
 */
@Controller("payments/qr")
@AcController()
@ApiTags("Payments")
export class PaymentQrController {
	constructor(private readonly paymentRequests: MemberPaymentRequestService) {}

	@Get(":code")
	@Header("Cache-Control", "public, max-age=3600")
	@Header("X-Content-Type-Options", "nosniff")
	@ApiExcludeEndpoint()
	async getPaymentQrCode(@Param("code") code: string): Promise<StreamableFile> {
		const qrCode = await this.paymentRequests.renderPaymentQrCode(code);
		if (!qrCode) throw new NotFoundException();

		// a StreamableFile (rather than the raw Buffer) so Nest sends the PNG bytes as they are
		// instead of serialising the Buffer to JSON
		return new StreamableFile(qrCode, { type: "image/png", disposition: 'inline; filename="qr-platba.png"' });
	}
}
