import { SDK } from "src/sdk";

export interface HealthSeverityMetadata {
	title: string;
	description: string;
	color: string;
	icon: string;
	emoji: string;
	order: number;
}

export const HealthSeverities: { [severity in SDK.HealthSeverityEnum]: HealthSeverityMetadata } = {
	unknown: {
		title: "Neznámá",
		description: "Závažnost není známá.",
		color: "medium",
		icon: "help-circle",
		emoji: "⚪",
		order: 0,
	},
	low: {
		title: "Mírná",
		description: "Drobná nepříjemnost, stačí o ní vědět.",
		color: "success",
		icon: "ellipse",
		emoji: "🟢",
		order: 1,
	},
	medium: {
		title: "Střední",
		description: "Vyžaduje opatrnost a pozornost.",
		color: "warning",
		icon: "alert-circle",
		emoji: "🟡",
		order: 2,
	},
	high: {
		title: "Vážná",
		description: "Může ohrozit zdraví či život – velká opatrnost.",
		color: "danger",
		icon: "warning",
		emoji: "🔴",
		order: 3,
	},
};

export const HealthSeverityOrder = (Object.keys(HealthSeverities) as SDK.HealthSeverityEnum[]).sort(
	(a, b) => HealthSeverities[a].order - HealthSeverities[b].order,
);

export const DefaultHealthSeverity: SDK.HealthSeverityEnum = "medium";
