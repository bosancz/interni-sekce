import { Roles, StaticRoles } from "src/access-control/schema/roles";
import { UserRoles } from "src/models/users/entities/user.entity";

export enum NotificationTypes {
	"myEvents" = "myEvents",
	"submittedEvents" = "submittedEvents",
	"newEvents" = "newEvents",
	"newUsers" = "newUsers",
}

export enum NotificationChannels {
	"disabled" = "disabled",
	"push" = "push",
	"email" = "email",
	"both" = "both",
}

export interface NotificationTypeMetadata {
	title: string;
	description: string;
	defaultChannel: NotificationChannels;
	/** Roles that receive and may configure this notification type; null = every registered user. */
	roles: Roles[] | null;
}

export const NotificationTypesMetadata: Record<NotificationTypes, NotificationTypeMetadata> = {
	[NotificationTypes.myEvents]: {
		title: "Moje akce",
		description: "Schválení, vrácení nebo zrušení akce, kterou vedu",
		defaultChannel: NotificationChannels.push,
		roles: [StaticRoles.vedouci],
	},
	[NotificationTypes.submittedEvents]: {
		title: "Akce ke schválení",
		description: "Akce odeslaná ke schválení programu",
		defaultChannel: NotificationChannels.push,
		roles: [UserRoles.program, UserRoles.admin],
	},
	[NotificationTypes.newEvents]: {
		title: "Nové akce",
		description: "Nově zveřejněné akce v programu",
		defaultChannel: NotificationChannels.push,
		roles: null,
	},
	[NotificationTypes.newUsers]: {
		title: "Noví uživatelé",
		description: "Nově založené uživatelské účty",
		defaultChannel: NotificationChannels.push,
		roles: [UserRoles.admin],
	},
};

export interface NotificationMessage {
	title: string;
	body?: string;
	path?: string;
}
