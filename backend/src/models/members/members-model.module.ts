import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettingsModelModule } from "src/models/settings/settings-model.module";
import { Group } from "./entities/group.entity";
import { MemberAchievement } from "./entities/member-achievements.entity";
import { MemberContact } from "./entities/member-contact.entity";
import { Member } from "./entities/member.entity";
import { GroupsRepository } from "./repositories/groups.repository";
import { MembersRepository } from "./repositories/members.repository";
import { MemberPaymentRequestService } from "./services/member-payment-request.service";
import { MembersExportService } from "./services/members-export.service";

@Module({
	imports: [TypeOrmModule.forFeature([Member, MemberContact, MemberAchievement, Group]), SettingsModelModule],
	providers: [MembersRepository, GroupsRepository, MembersExportService, MemberPaymentRequestService],
	exports: [MembersRepository, GroupsRepository, MembersExportService, MemberPaymentRequestService],
})
export class MembersModelModule {}
