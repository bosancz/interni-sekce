import { Injectable, Logger } from "@nestjs/common";
import { DateTime } from "luxon";
import { Config } from "src/config";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { MemberRoles } from "src/models/members/schema/member-roles";
import { NotificationTypes } from "src/models/notifications/schema/notification-types";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { formatBirthdaysBody, getBirthdayDays } from "../helpers/birthdays";

const BIRTHDAY_NOTIFICATIONS = [
	{ type: NotificationTypes.leaderBirthdays, roles: [MemberRoles.vedouci, MemberRoles.instruktor] },
	{ type: NotificationTypes.childBirthdays, roles: [MemberRoles.dite] },
] as const;

@Injectable()
export class MemberBirthdaysService {
	private logger = new Logger(MemberBirthdaysService.name);

	constructor(
		private members: MembersRepository,
		private notificationsService: NotificationsService,
		private config: Config,
	) {}

	async notifyBirthdays(date = DateTime.now().setZone(this.config.birthdays.timezone)) {
		const { month, days } = getBirthdayDays(date);

		for (const { type, roles } of BIRTHDAY_NOTIFICATIONS) {
			const members = await this.members.getBirthdayMembers([...roles], month, days);
			if (!members.length) continue;

			const recipients = await this.notificationsService.onMemberBirthdays(
				type,
				members,
				formatBirthdaysBody(members, date),
			);
			this.logger.log(`${type}: ${members.length} birthdays sent to ${recipients} users.`);
		}
	}
}
