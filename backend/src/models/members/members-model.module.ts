import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "./entities/group.entity";
import { MemberAchievement } from "./entities/member-achievements.entity";
import { MemberContact } from "./entities/member-contacts.entity";
import { Member } from "./entities/member.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Member, MemberContact, MemberAchievement, Group])],
})
export class MembersModelModule {}
