export enum BadgeTypes {
	"firstEvent" = "firstEvent",
	"eventsAttended" = "eventsAttended",
	"daysOnEvents" = "daysOnEvents",
	"longEvents" = "longEvents",
	"seasons" = "seasons",
	"firstLed" = "firstLed",
	"eventsLed" = "eventsLed",
	"childDays" = "childDays",
	"topLeader" = "topLeader",
	"podium" = "podium",
	"topEvent" = "topEvent",
	"photos" = "photos",
}

export interface BadgeTypeMetadata {
	title: string;
	description: string;
	unit: string;
	icon: string;
	thresholds: number[];
}

export const BadgeTypesMetadata: Record<BadgeTypes, BadgeTypeMetadata> = {
	[BadgeTypes.firstEvent]: {
		title: "Poprvé na akci",
		description: "Zúčastni se první akce.",
		unit: "akcí",
		icon: "flag",
		thresholds: [1],
	},
	[BadgeTypes.eventsAttended]: {
		title: "Akční",
		description: "Počet akcí, na kterých jsi byl/a — jako účastník i jako vedoucí.",
		unit: "akcí",
		icon: "walk",
		thresholds: [10, 25, 50, 100, 200],
	},
	[BadgeTypes.daysOnEvents]: {
		title: "Dny v terénu",
		description: "Kolik dní jsi celkem strávil/a na akcích.",
		unit: "dní",
		icon: "sunny",
		thresholds: [7, 30, 100, 365, 730],
	},
	[BadgeTypes.longEvents]: {
		title: "Táborník",
		description: "Akce dlouhé aspoň týden — tábory a velké výpravy.",
		unit: "akcí",
		icon: "bonfire",
		thresholds: [1, 5, 10],
	},
	[BadgeTypes.seasons]: {
		title: "Věrnost",
		description: "Roky, ve kterých jsi byl/a aspoň na jedné akci.",
		unit: "let",
		icon: "calendar",
		thresholds: [3, 5, 10],
	},
	[BadgeTypes.firstLed]: {
		title: "První vedená akce",
		description: "Veď svou první akci.",
		unit: "akcí",
		icon: "compass",
		thresholds: [1],
	},
	[BadgeTypes.eventsLed]: {
		title: "Ostřílený vedoucí",
		description: "Počet akcí, které jsi vedl/a.",
		unit: "akcí",
		icon: "trail-sign",
		thresholds: [5, 15, 30, 60],
	},
	[BadgeTypes.childDays]: {
		title: "Děťodny",
		description:
			"Děťodny na akcích, které jsi vedl/a — počet dětí krát počet dní, stejně jako v žebříčku vedoucích.",
		unit: "děťodní",
		icon: "people",
		thresholds: [50, 200, 500, 1000, 2500],
	},
	[BadgeTypes.topLeader]: {
		title: "Nejlepší vedoucí",
		description: "Buď na 1. místě v žebříčku vedoucích. Stačí se tam jednou dostat — odznak už ti zůstane.",
		unit: "let",
		icon: "trophy",
		thresholds: [1, 3],
	},
	[BadgeTypes.podium]: {
		title: "Na stupních vítězů",
		description: "Umísti se do 3. místa v žebříčku vedoucích.",
		unit: "let",
		icon: "podium",
		thresholds: [1, 3, 5],
	},
	[BadgeTypes.topEvent]: {
		title: "Akce roku",
		description: "Veď akci, která je na 1. místě v žebříčku akcí.",
		unit: "akcí",
		icon: "star",
		thresholds: [1],
	},
	[BadgeTypes.photos]: {
		title: "Tvář galerie",
		description: "Fotky, na kterých tě poznalo přiřazování obličejů.",
		unit: "fotek",
		icon: "camera",
		thresholds: [10, 50, 200, 500],
	},
};
