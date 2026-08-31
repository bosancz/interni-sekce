import { Module } from "@nestjs/common";
import { SettingsModelModule } from "src/models/settings/settings-model.module";
import { PaymentSettingsController } from "./controllers/payment-settings.controller";

@Module({
	controllers: [PaymentSettingsController],
	imports: [SettingsModelModule],
})
export class PaymentsModule {}
