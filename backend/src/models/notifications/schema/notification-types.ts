import { Roles, StaticRoles } from "src/access-control/schema/roles";
import { UserRoles } from "src/models/users/entities/user.entity";

export enum NotificationTypes {
	"myEvents" = "myEvents",
	"submittedEvents" = "submittedEvents",
	"newEvents" = "newEvents",
	"newEventReports" = "newEventReports",
	"newUsers" = "newUsers",
	"myBugReports" = "myBugReports",
	"myPhotos" = "myPhotos",
	"newAlbums" = "newAlbums",
	"backups" = "backups",
}

export enum NotificationChannels {
	"push" = "push",
	"email" = "email",
	"inApp" = "inApp",
}

export enum NotificationGroups {
	"events" = "events",
	"photos" = "photos",
	"admin" = "admin",
}

export const NotificationGroupsMetadata: Record<NotificationGroups, { title: string }> = {
	[NotificationGroups.events]: { title: "Akce" },
	[NotificationGroups.photos]: { title: "Fotky" },
	[NotificationGroups.admin]: { title: "Administrace" },
};

export interface NotificationTypeMetadata {
	group: NotificationGroups;
	title: string;
	description: string;
	defaultChannels: NotificationChannels[];
	roles: Roles[] | null;
	defaultRoles?: Roles[];
}

export const NotificationTypesMetadata: Record<NotificationTypes, NotificationTypeMetadata> = {
	[NotificationTypes.myEvents]: {
		group: NotificationGroups.events,
		title: "Moje akce",
		description: "Schválení, vrácení nebo zrušení akce, kterou vedu",
		defaultChannels: [NotificationChannels.push, NotificationChannels.inApp],
		roles: [StaticRoles.vedouci],
	},
	[NotificationTypes.submittedEvents]: {
		group: NotificationGroups.events,
		title: "Akce ke schválení",
		description: "Akce odeslaná ke schválení programu",
		defaultChannels: [],
		roles: [UserRoles.program, UserRoles.admin],
	},
	[NotificationTypes.newEvents]: {
		group: NotificationGroups.events,
		title: "Nové akce",
		description: "Nově zveřejněné akce v programu",
		defaultChannels: [NotificationChannels.push, NotificationChannels.inApp],
		roles: null,
	},
	[NotificationTypes.newEventReports]: {
		group: NotificationGroups.events,
		title: "Nové reporty z akcí",
		description: "Vedoucí akce zveřejnil report z akce",
		defaultChannels: [NotificationChannels.push, NotificationChannels.inApp],
		roles: null,
		defaultRoles: [UserRoles.revizor],
	},
	[NotificationTypes.newUsers]: {
		group: NotificationGroups.admin,
		title: "Noví uživatelé",
		description: "Nově založené uživatelské účty",
		defaultChannels: [],
		roles: [UserRoles.admin],
	},
	[NotificationTypes.myBugReports]: {
		group: NotificationGroups.admin,
		title: "Moje nahlášené chyby",
		description: "Nasazení opravy chyby, kterou jsem nahlásil",
		defaultChannels: [NotificationChannels.push, NotificationChannels.inApp],
		roles: null,
	},
	[NotificationTypes.myPhotos]: {
		group: NotificationGroups.photos,
		title: "Nové fotky se mnou",
		description: "Fotky, na kterých mě nově rozpoznalo přiřazování obličejů — posílá se jednou denně ráno",
		defaultChannels: [NotificationChannels.inApp],
		roles: [StaticRoles.vedouci],
	},
	[NotificationTypes.newAlbums]: {
		group: NotificationGroups.photos,
		title: "Nová alba",
		description: "Nově zveřejněná alba ve fotogalerii",
		defaultChannels: [NotificationChannels.inApp],
		roles: [StaticRoles.vedouci],
	},
	[NotificationTypes.backups]: {
		group: NotificationGroups.admin,
		title: "Zálohy",
		description: "Záloha databáze nebo souborů skončila chybou nebo dlouho neproběhla — kontroluje se jednou denně",
		defaultChannels: [NotificationChannels.email, NotificationChannels.inApp],
		roles: [UserRoles.admin],
	},
};

export function isNotificationTypeForRoles(type: NotificationTypes, roles: string[]) {
	const metadataRoles = NotificationTypesMetadata[type].roles;
	return !metadataRoles || metadataRoles.some((role) => roles.includes(role));
}

export function getNotificationDefaultChannels(type: NotificationTypes, roles: string[]) {
	const metadata = NotificationTypesMetadata[type];
	if (metadata.defaultRoles)
		return metadata.defaultRoles.some((role) => roles.includes(role)) ? metadata.defaultChannels : [];

	const staticRoles: string[] = Object.values(StaticRoles);
	const forStaticRole = metadata.roles?.some((role) => staticRoles.includes(role));
	return forStaticRole || isNotificationTypeForRoles(type, roles) ? metadata.defaultChannels : [];
}

export interface NotificationMessage {
	title: string;
	body?: string;
	path?: string;
}
