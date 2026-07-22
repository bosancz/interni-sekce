export interface EventStatus {
	name: string;
	color: string;
	/** status pill colours — blue = in preparation, yellow = needs attention, neutral = informational */
	background: string;
	foreground: string;
}

export type EventStatusID = keyof typeof EventStatuses;

const asEventStatuses = <T>(value: { [key in keyof T]: EventStatus }) => value;

export const EventStatuses = asEventStatuses({
	draft: {
		name: "Připravovaná",
		color: "#6b7185",
		background: "var(--bo-neutral-pill, #eef1f6)",
		foreground: "var(--bo-neutral-pill-text, #6b7185)",
	},
	pending: {
		name: "Čeká na schválení",
		color: "#e28f26",
		background: "var(--bo-yellow-tint, #fdf1de)",
		foreground: "var(--bo-yellow-deep, #b9720f)",
	},
	public: {
		name: "V programu",
		color: "#799f3d",
		background: "var(--bo-green-tint, #eef4e4)",
		foreground: "var(--bo-green, #799f3d)",
	},
	cancelled: {
		name: "Zrušená",
		color: "#d2232a",
		background: "var(--bo-red-tint, #fbe7e7)",
		foreground: "var(--bo-red, #d2232a)",
	},
	finalized: {
		name: "Uzavřená",
		color: "#1f2430",
		background: "var(--bo-neutral-pill, #eef1f6)",
		foreground: "var(--bo-neutral-pill-text, #6b7185)",
	},
	rejected: {
		name: "Vrácená k úpravám",
		color: "#e28f26",
		background: "var(--bo-yellow-tint, #fdf1de)",
		foreground: "var(--bo-yellow-deep, #b9720f)",
	},
});
