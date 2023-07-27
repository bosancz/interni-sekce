import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Group } from "src/models/members/entities/group.entity";
import { Member } from "src/models/members/entities/member.entity";
import { MembersModelModule } from "src/models/members/members-model.module";
import { GroupsController } from "./controllers/groups.controller";
import { MembersController } from "./controllers/members.controller";
import { MemberInsuranceCardController } from './controllers/member-insurance-card.controller';

@Module({
  controllers: [MembersController, GroupsController, MemberInsuranceCardController],
  imports: [MembersModelModule, TypeOrmModule.forFeature([Member, Group])],
})
export class MembersModule {}
