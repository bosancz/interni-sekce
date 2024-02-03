import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./entities/group.entity";
import { MemberAchievement } from "./entities/member-achievements.entity";
import { MemberContact } from "./entities/member-contact.entity";
import { Member } from "./entities/member.entity";
import { GroupsRepository } from "./repositories/groups.repository";
import { MembersRepository } from "./repositories/members.repository";
import { MembersExportService } from "./services/members-export.service";

@Module({
  imports: [TypeOrmModule.forFeature([Member, MemberContact, MemberAchievement, Group])],
  providers: [MembersRepository, GroupsRepository, MembersExportService],
  exports: [MembersRepository, GroupsRepository, MembersExportService],
})
export class MembersModelModule {}
