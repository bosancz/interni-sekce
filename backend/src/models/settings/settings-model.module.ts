import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FaceMatchingSettings } from "./entities/face-matching-settings.entity";
import { PaymentSettings } from "./entities/payment-settings.entity";
import { FaceMatchingSettingsRepository } from "./repositories/face-matching-settings.repository";
import { PaymentSettingsRepository } from "./repositories/payment-settings.repository";

@Module({
	imports: [TypeOrmModule.forFeature([PaymentSettings, FaceMatchingSettings])],
	providers: [PaymentSettingsRepository, FaceMatchingSettingsRepository],
	exports: [PaymentSettingsRepository, FaceMatchingSettingsRepository],
})
export class SettingsModelModule {}
