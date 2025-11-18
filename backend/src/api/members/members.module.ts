import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesModule } from "src/models/files/files.module";
import { Group } from "src/models/members/entities/group.entity";
import { Member } from "src/models/members/entities/member.entity";
import { MembersModelModule } from "src/models/members/members-model.module";
import { GroupsController } from "./controllers/groups.controller";
import { MemberContactsController } from "./controllers/member-contacts.controller";
import { MemberInsuranceCardController } from "./controllers/member-insurance-card.controller";
import { MembersController } from "./controllers/members.controller";
import { MembersExportController } from "./controllers/members-export.controller";

@Module({
	controllers: [
		MembersController,
		GroupsController,
		MemberInsuranceCardController,
		MemberContactsController,
		MembersExportController,
	],
	imports: [MembersModelModule, TypeOrmModule.forFeature([Member, Group]), FilesModule],
})
export class MembersModule {}
