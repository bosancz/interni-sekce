import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DateTime } from "luxon";
import { Config } from "src/config";
import { Event } from "src/models/events/entities/event.entity";
import { MailService } from "src/models/mail/services/mail.service";
import { User, UserRoles } from "src/models/users/entities/user.entity";
import { In, Repository } from "typeorm";
import { NotificationMailTemplate } from "../mail-templates/notification/notification.mail-template";
import { NotificationSettingsRepository } from "../repositories/notification-settings.repository";
import { NotificationSubscriptionsRepository } from "../repositories/notification-subscriptions.repository";
import {
	NotificationChannels,
	NotificationMessage,
	NotificationTypes,
	NotificationTypesMetadata,
} from "../schema/notification-types";
import { PushService } from "./push.service";

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);

	constructor(
		@InjectRepository(User) private users: Repository<User>,
		private subscriptions: NotificationSubscriptionsRepository,
		private settings: NotificationSettingsRepository,
		private push: PushService,
		private mail: MailService,
		private config: Config,
	) {}

	async onEventSubmitted(event: Event, actorUserId?: number) {
		const recipients = await this.getUsersByRoles([UserRoles.program, UserRoles.admin]);

		await this.notifyUsers(NotificationTypes.submittedEvents, recipients, actorUserId, {
			title: `Akce ke schválení: ${event.name}`,
			body: this.formatEventDates(event),
			path: `/akce/${event.id}`,
		});
	}

	async onEventPublished(event: Event, actorUserId?: number) {
		const leaders = await this.getEventLeaderUsers(event);

		await this.notifyUsers(NotificationTypes.myEvents, leaders, actorUserId, {
			title: `Akce „${event.name}“ byla schválena a zveřejněna`,
			body: this.formatEventDates(event),
			path: `/akce/${event.id}`,
		});

		const others = (await this.users.find()).filter((user) => !leaders.some((leader) => leader.id === user.id));

		await this.notifyUsers(NotificationTypes.newEvents, others, actorUserId, {
			title: `Nová akce v programu: ${event.name}`,
			body: this.formatEventDates(event),
			path: `/akce/${event.id}`,
		});
	}

	async onEventRejected(event: Event, statusNote: string | null | undefined, actorUserId?: number) {
		const leaders = await this.getEventLeaderUsers(event);

		await this.notifyUsers(NotificationTypes.myEvents, leaders, actorUserId, {
			title: `Akce „${event.name}“ byla vrácena k úpravám`,
			body: statusNote || undefined,
			path: `/akce/${event.id}`,
		});
	}

	async onEventCancelled(event: Event, statusNote: string | null | undefined, actorUserId?: number) {
		const leaders = await this.getEventLeaderUsers(event);

		await this.notifyUsers(NotificationTypes.myEvents, leaders, actorUserId, {
			title: `Akce „${event.name}“ byla zrušena`,
			body: statusNote || undefined,
			path: `/akce/${event.id}`,
		});
	}

	async onEventUncancelled(event: Event, actorUserId?: number) {
		const leaders = await this.getEventLeaderUsers(event);

		await this.notifyUsers(NotificationTypes.myEvents, leaders, actorUserId, {
			title: `Akce „${event.name}“ byla obnovena`,
			body: this.formatEventDates(event),
			path: `/akce/${event.id}`,
		});
	}

	async onUserCreated(user: User, actorUserId?: number) {
		const recipients = await this.getUsersByRoles([UserRoles.admin]);

		await this.notifyUsers(NotificationTypes.newUsers, recipients, actorUserId, {
			title: `Nový uživatel: ${user.login}`,
			path: `/admin/uzivatele/${user.id}`,
		});
	}

	private async notifyUsers(
		type: NotificationTypes,
		users: User[],
		actorUserId: number | undefined,
		message: NotificationMessage,
	) {
		const recipients = users.filter((user) => user.id !== actorUserId);
		if (!recipients.length) return;

		const settings = await this.settings.getUsersSettings(
			recipients.map((user) => user.id),
			type,
		);
		const channels = new Map(settings.map((setting) => [setting.userId, setting.channel]));
		const defaultChannel = NotificationTypesMetadata[type].defaultChannel;

		const pushUsers: User[] = [];
		const emailUsers: User[] = [];

		for (const user of recipients) {
			const channel = channels.get(user.id) ?? defaultChannel;
			if ([NotificationChannels.push, NotificationChannels.both].includes(channel)) pushUsers.push(user);
			if ([NotificationChannels.email, NotificationChannels.both].includes(channel)) emailUsers.push(user);
		}

		await Promise.all([this.sendPush(pushUsers, message), this.sendEmails(emailUsers, message)]);
	}

	private async sendPush(users: User[], message: NotificationMessage) {
		if (!this.push.isConfigured || !users.length) return;

		const subscriptions = await this.subscriptions.getSendableSubscriptions(users.map((user) => user.id));

		const payload = {
			title: message.title,
			body: message.body,
			url: message.path ? this.config.app.baseUrl + message.path : undefined,
		};

		for (const subscription of subscriptions) {
			try {
				const alive = await this.push.send(
					{
						endpoint: subscription.endpoint!,
						keyP256dh: subscription.keyP256dh!,
						keyAuth: subscription.keyAuth!,
					},
					payload,
				);

				// expired subscriptions are cleaned up here, since only sending discovers them
				if (!alive) await this.subscriptions.deleteSubscription(subscription.id);
			} catch (err) {
				this.logger.error(`Failed to send push notification: ${(err as Error).message}`);
			}
		}
	}

	private async sendEmails(users: User[], message: NotificationMessage) {
		for (const user of users) {
			if (!user.email) continue;

			const mail = NotificationMailTemplate(user.email, {
				title: message.title,
				body: message.body,
				url: message.path ? this.config.app.baseUrl + message.path : undefined,
				settingsUrl: `${this.config.app.baseUrl}/ucet`,
			});

			try {
				await this.mail.sendMail(mail);
			} catch (err) {
				this.logger.error(`Failed to send notification email to ${user.email}: ${(err as Error).message}`);
			}
		}
	}

	private async getUsersByRoles(roles: UserRoles[]) {
		return this.users
			.createQueryBuilder("user")
			.where("user.roles && array[:...roles]::users_roles_enum[]", { roles })
			.getMany();
	}

	private async getEventLeaderUsers(event: Event) {
		const memberIds = event.leaders?.map((leader) => leader.id) ?? [];
		if (!memberIds.length) return [];
		return this.users.find({ where: { memberId: In(memberIds) } });
	}

	private formatEventDates(event: Pick<Event, "dateFrom" | "dateTill">) {
		const from = DateTime.fromISO(event.dateFrom).setLocale("cs");
		const till = DateTime.fromISO(event.dateTill).setLocale("cs");

		if (event.dateFrom === event.dateTill) return from.toFormat("d. M. yyyy");
		return `${from.toFormat("d. M.")} – ${till.toFormat("d. M. yyyy")}`;
	}
}
