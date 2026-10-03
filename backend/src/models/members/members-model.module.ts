import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesModule } from "src/models/files/files.module";
import { SettingsModelModule } from "src/models/settings/settings-model.module";
import { Group } from "./entities/group.entity";
import { MemberAchievement } from "./entities/member-achievements.entity";
import { MemberContact } from "./entities/member-contact.entity";
import { Member } from "./entities/member.entity";
import { MembershipPayment } from "./entities/membership-payment.entity";
import { GroupsRepository } from "./repositories/groups.repository";
import { MembersRepository } from "./repositories/members.repository";
import { MemberMergeService } from "./services/member-merge.service";
import { MemberPaymentRequestService } from "./services/member-payment-request.service";
import { MembershipPaymentService } from "./services/membership-payment.service";
import { MembersExportService } from "./services/members-export.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Member, MemberContact, MemberAchievement, MembershipPayment, Group]),
		SettingsModelModule,
		FilesModule,
	],
	providers: [
		MembersRepository,
		GroupsRepository,
		MembersExportService,
		MemberPaymentRequestService,
		MembershipPaymentService,
		MemberMergeService,
	],
	exports: [
		MembersRepository,
		GroupsRepository,
		MembersExportService,
		MemberPaymentRequestService,
		MembershipPaymentService,
		MemberMergeService,
	],
})
export class MembersModelModule {}
