import { Roles, StaticRoles } from "src/access-control/schema/roles";
import { UserRoles } from "src/models/users/entities/user.entity";

export enum NotificationTypes {
	"myEvents" = "myEvents",
	"submittedEvents" = "submittedEvents",
	"newEvents" = "newEvents",
	"newUsers" = "newUsers",
}

export enum NotificationChannels {
	"push" = "push",
	"email" = "email",
	"inApp" = "inApp",
}

/** Push and e-mail notifications always show on the in-app notifications page too. */
export function normalizeNotificationChannels(channels: NotificationChannels[]): NotificationChannels[] {
	const forcesInApp = channels.includes(NotificationChannels.push) || channels.includes(NotificationChannels.email);
	if (forcesInApp && !channels.includes(NotificationChannels.inApp)) return [...channels, NotificationChannels.inApp];
	return channels;
}

export interface NotificationTypeMetadata {
	title: string;
	description: string;
	defaultChannels: NotificationChannels[];
	/** Roles that receive and may configure this notification type; null = every registered user. */
	roles: Roles[] | null;
}

export const NotificationTypesMetadata: Record<NotificationTypes, NotificationTypeMetadata> = {
	[NotificationTypes.myEvents]: {
		title: "Moje akce",
		description: "Schválení, vrácení nebo zrušení akce, kterou vedu",
		defaultChannels: [NotificationChannels.push, NotificationChannels.inApp],
		roles: [StaticRoles.vedouci],
	},
	[NotificationTypes.submittedEvents]: {
		title: "Akce ke schválení",
		description: "Akce odeslaná ke schválení programu",
		defaultChannels: [NotificationChannels.push, NotificationChannels.inApp],
		roles: [UserRoles.program, UserRoles.admin],
	},
	[NotificationTypes.newEvents]: {
		title: "Nové akce",
		description: "Nově zveřejněné akce v programu",
		defaultChannels: [NotificationChannels.push, NotificationChannels.inApp],
		roles: null,
	},
	[NotificationTypes.newUsers]: {
		title: "Noví uživatelé",
		description: "Nově založené uživatelské účty",
		defaultChannels: [NotificationChannels.push, NotificationChannels.inApp],
		roles: [UserRoles.admin],
	},
};

export interface NotificationMessage {
	title: string;
	body?: string;
	path?: string;
}
