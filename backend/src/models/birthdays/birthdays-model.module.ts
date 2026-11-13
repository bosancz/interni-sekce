import { Module } from "@nestjs/common";
import { MembersModelModule } from "src/models/members/members-model.module";
import { NotificationsModelModule } from "src/models/notifications/notifications-model.module";
import { BirthdaysNotifyCommand } from "./commands/birthdays-notify.command";
import { MemberBirthdaysService } from "./services/member-birthdays.service";

@Module({
	imports: [MembersModelModule, NotificationsModelModule],
	providers: [MemberBirthdaysService, BirthdaysNotifyCommand],
	exports: [MemberBirthdaysService],
})
export class BirthdaysModelModule {}
