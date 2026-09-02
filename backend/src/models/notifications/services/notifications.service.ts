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
import { NotificationsRepository } from "../repositories/notifications.repository";
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
		private notificationSubscriptions: NotificationSubscriptionsRepository,
		private notificationSettings: NotificationSettingsRepository,
		private notifications: NotificationsRepository,
		private pushService: PushService,
		private mailService: MailService,
		private config: Config,
	) {
		if (this.config.notifications.notifyActor)
			this.logger.warn("NOTIFY_ACTOR is enabled, users receive notifications for their own actions.");
	}

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

	async onBugReportResolved(user: User, fix: { title: string; version: string; description: string }) {
		await this.notifyUsers(NotificationTypes.myBugReports, [user], undefined, {
			title: `Opraveno: ${fix.title}`,
			body: `Nasazeno ve verzi ${fix.version} — ${fix.description}`,
		});
	}

	private async notifyUsers(
		type: NotificationTypes,
		users: User[],
		actorUserId: number | undefined,
		message: NotificationMessage,
	) {
		const recipients = this.config.notifications.notifyActor
			? users
			: users.filter((user) => user.id !== actorUserId);
		if (!recipients.length) return;

		const settings = await this.notificationSettings.getUsersSettings(
			recipients.map((user) => user.id),
			type,
		);
		const overrides = new Map(settings.map((setting) => [setting.userId, setting.channels]));
		const defaultChannels = NotificationTypesMetadata[type].defaultChannels;

		const pushUsers: User[] = [];
		const emailUsers: User[] = [];
		const inAppUsers: User[] = [];

		for (const user of recipients) {
			const channels = overrides.get(user.id) ?? defaultChannels;
			if (channels.includes(NotificationChannels.push)) pushUsers.push(user);
			if (channels.includes(NotificationChannels.email)) emailUsers.push(user);
			if (channels.includes(NotificationChannels.inApp)) inAppUsers.push(user);
		}

		await Promise.all([
			this.sendPush(pushUsers, message),
			this.sendEmails(emailUsers, message),
			this.saveInApp(type, inAppUsers, message),
		]);
	}

	private async sendPush(users: User[], message: NotificationMessage) {
		if (!this.pushService.isConfigured || !users.length) return;

		const subscriptions = await this.notificationSubscriptions.getSendableSubscriptions(
			users.map((user) => user.id),
		);

		const url = message.path ? this.config.app.baseUrl + message.path : undefined;
		const payload = {
			notification: {
				title: message.title,
				body: message.body,
				data: url ? { onActionClick: { default: { operation: "navigateLastFocusedOrOpen", url } } } : undefined,
			},
		};

		for (const subscription of subscriptions) {
			try {
				const alive = await this.pushService.send(
					{
						endpoint: subscription.endpoint!,
						keyP256dh: subscription.keyP256dh!,
						keyAuth: subscription.keyAuth!,
					},
					payload,
				);

				if (!alive) await this.notificationSubscriptions.deleteSubscription(subscription.id);
			} catch (err) {
				this.logger.error(`Failed to send push notification: ${(err as Error).message}`);
			}
		}
	}

	private async saveInApp(type: NotificationTypes, users: User[], message: NotificationMessage) {
		await this.notifications.createNotifications(
			users.map((user) => ({
				userId: user.id,
				type,
				title: message.title,
				body: message.body ?? null,
				path: message.path ?? null,
			})),
		);
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
				await this.mailService.sendMail(mail);
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
