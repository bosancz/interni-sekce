import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentSettings } from "./entities/payment-settings.entity";
import { PaymentSettingsRepository } from "./repositories/payment-settings.repository";

@Module({
	imports: [TypeOrmModule.forFeature([PaymentSettings])],
	providers: [PaymentSettingsRepository],
	exports: [PaymentSettingsRepository],
})
export class SettingsModelModule {}
