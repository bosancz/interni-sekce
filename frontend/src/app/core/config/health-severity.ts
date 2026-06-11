import { SDK } from "src/sdk";

export interface HealthSeverityMetadata {
	/** Short human readable label. */
	title: string;
	/** Longer explanation shown in the editing form. */
	description: string;
	/** Ionic color used for badges, icons and the severity bar. */
	color: string;
	/** Ionicon name representing the severity. */
	icon: string;
	/** Emoji used as a compact, color-blind friendly indicator. */
	emoji: string;
	/** Sort order from least to most severe. */
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

/** Severity values ordered from least to most severe. */
export const HealthSeverityOrder = (Object.keys(HealthSeverities) as SDK.HealthSeverityEnum[]).sort(
	(a, b) => HealthSeverities[a].order - HealthSeverities[b].order,
);

/** Default severity used for newly added entries. */
export const DefaultHealthSeverity: SDK.HealthSeverityEnum = "medium";
