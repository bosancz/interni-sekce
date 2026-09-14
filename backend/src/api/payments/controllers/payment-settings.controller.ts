import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { PaymentSettingsRepository } from "src/models/settings/repositories/payment-settings.repository";
import { PaymentSettingsReadPermission, PaymentSettingsUpdatePermission } from "../acl/payment-settings.acl";
import { PaymentSettingsResponse, PaymentSettingsUpdateBody } from "../dto/payment-settings.dto";

@Controller("payments/settings")
@Authenticated()
@AcController()
@ApiTags("Payments")
export class PaymentSettingsController {
	constructor(private readonly paymentSettings: PaymentSettingsRepository) {}

	@Get()
	@AcLinks(PaymentSettingsReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(PaymentSettingsResponse) })
	async getPaymentSettings(@Req() req: Request): Promise<PaymentSettingsResponse> {
		PaymentSettingsReadPermission.canOrThrow(req);

		const { accountNumber, bankCode, amount, currency } = await this.paymentSettings.getPaymentSettings();

		return { accountNumber, bankCode, amount, currency };
	}

	@Patch()
	@AcLinks(PaymentSettingsUpdatePermission)
	@ApiResponse({ status: 200, type: WithLinks(PaymentSettingsResponse) })
	async updatePaymentSettings(
		@Req() req: Request,
		@Body() body: PaymentSettingsUpdateBody,
	): Promise<PaymentSettingsResponse> {
		PaymentSettingsUpdatePermission.canOrThrow(req);

		const { accountNumber, bankCode, amount, currency } = await this.paymentSettings.updatePaymentSettings(body);

		return { accountNumber, bankCode, amount, currency };
	}
}
