import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./entities/group.entity";
import { MemberAchievement } from "./entities/member-achievements.entity";
import { MemberContact } from "./entities/member-contacts.entity";
import { Member } from "./entities/member.entity";
import { GroupsService } from "./services/groups.service";
import { MembersService } from "./services/members.service";

@Module({
  imports: [TypeOrmModule.forFeature([Member, MemberContact, MemberAchievement, Group])],
  providers: [MembersService, GroupsService],
  exports: [MembersService, GroupsService],
})
export class MembersModelModule {}
