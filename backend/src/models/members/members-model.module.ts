import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesModule } from "src/models/files/files.module";
import { SettingsModelModule } from "src/models/settings/settings-model.module";
import { BoardMember } from "./entities/board-member.entity";
import { Group } from "./entities/group.entity";
import { MemberAchievement } from "./entities/member-achievements.entity";
import { MemberContact } from "./entities/member-contact.entity";
import { Member } from "./entities/member.entity";
import { MembershipPayment } from "./entities/membership-payment.entity";
import { MemberAchievementsRepository } from "./repositories/member-achievements.repository";
import { BoardMembersRepository } from "./repositories/board-members.repository";
import { GroupsRepository } from "./repositories/groups.repository";
import { MembersRepository } from "./repositories/members.repository";
import { MemberMergeService } from "./services/member-merge.service";
import { MemberPaymentRequestService } from "./services/member-payment-request.service";
import { MembershipPaymentService } from "./services/membership-payment.service";
import { MembersExportService } from "./services/members-export.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([Member, MemberContact, MemberAchievement, MembershipPayment, Group, BoardMember]),
		SettingsModelModule,
		FilesModule,
	],
	providers: [
		MembersRepository,
		MemberAchievementsRepository,
		GroupsRepository,
		BoardMembersRepository,
		MembersExportService,
		MemberPaymentRequestService,
		MembershipPaymentService,
		MemberMergeService,
	],
	exports: [
		MembersRepository,
		MemberAchievementsRepository,
		GroupsRepository,
		BoardMembersRepository,
		MembersExportService,
		MemberPaymentRequestService,
		MembershipPaymentService,
		MemberMergeService,
	],
})
export class MembersModelModule {}
