import { Module } from "@nestjs/common";
import { MembersModelModule } from "src/models/members/members-model.module";
import { SettingsModelModule } from "src/models/settings/settings-model.module";
import { PaymentQrController } from "./controllers/payment-qr.controller";
import { PaymentSettingsController } from "./controllers/payment-settings.controller";

@Module({
	controllers: [PaymentSettingsController, PaymentQrController],
	imports: [MembersModelModule, SettingsModelModule],
})
export class PaymentsModule {}
