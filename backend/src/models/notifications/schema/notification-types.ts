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

export interface NotificationTypeMetadata {
	title: string;
	description: string;
	defaultChannels: NotificationChannels[];
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
		defaultChannels: [],
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
		defaultChannels: [],
		roles: [UserRoles.admin],
	},
};

export interface NotificationMessage {
	title: string;
	body?: string;
	path?: string;
}
