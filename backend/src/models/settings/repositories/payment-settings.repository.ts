import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentSettings } from "../entities/payment-settings.entity";

@Injectable()
export class PaymentSettingsRepository {
	constructor(
		@InjectRepository(PaymentSettings) private paymentSettingsRepository: Repository<PaymentSettings>,
	) {}

	/**
	 * The single settings row. It is seeded by the PaymentSettings migration, so a missing
	 * row means the database was not migrated — a server-side problem, not a 404.
	 */
	async getPaymentSettings(): Promise<PaymentSettings> {
		const settings = await this.paymentSettingsRepository.findOne({ where: {}, order: { id: "ASC" } });
		if (!settings) throw new InternalServerErrorException("Payment settings are not configured.");

		return settings;
	}
}
