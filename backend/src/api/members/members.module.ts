import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { FilesModule } from "src/models/files/files.module";
import { Group } from "src/models/members/entities/group.entity";
import { Member } from "src/models/members/entities/member.entity";
import { MembersModelModule } from "src/models/members/members-model.module";
import { SettingsModelModule } from "src/models/settings/settings-model.module";
import { GroupsController } from "./controllers/groups.controller";
import { MemberContactsController } from "./controllers/member-contacts.controller";
import { MemberInsuranceCardController } from "./controllers/member-insurance-card.controller";
import { MemberPhotosController } from "./controllers/member-photos.controller";
import { MemberMembershipController } from "./controllers/member-membership.controller";
import { MemberPaymentQrController } from "./controllers/member-payment-qr.controller";
import { MemberPaymentRequestController } from "./controllers/member-payment-request.controller";
import { MembersController } from "./controllers/members.controller";
import { MembersExportController } from "./controllers/members-export.controller";

@Module({
	controllers: [
		MembersController,
		GroupsController,
		MemberInsuranceCardController,
		MemberContactsController,
		MemberMembershipController,
		MemberPaymentRequestController,
		MemberPaymentQrController,
		MembersExportController,
		MemberPhotosController,
	],
	imports: [
		AlbumsModelModule,
		MembersModelModule,
		SettingsModelModule,
		TypeOrmModule.forFeature([Member, Group]),
		FilesModule,
	],
})
export class MembersModule {}
