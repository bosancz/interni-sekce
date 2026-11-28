import { SDK } from "src/sdk";
import { EventTypeID } from "./event-types";

export interface EventKind {
	label: string;
	plural: string;
	image?: string;
	type?: EventTypeID;
	types?: EventTypeID[];
}

export const EventKinds: Record<SDK.EventKindsEnum, EventKind> = {
	akce: { label: "Akce", plural: "Akce" },
	tabor: {
		label: "Tábor",
		plural: "Tábory",
		image: "/assets/img/events/types/tent.svg",
		type: EventTypeID.tábor,
		types: [EventTypeID.tábor],
	},
	putak: {
		label: "Puťák",
		plural: "Puťáky",
		image: "/assets/img/events/types/kayak.svg",
		type: EventTypeID.voda,
	},
};

export const EVENT_KIND_OPTIONS = (Object.keys(EventKinds) as SDK.EventKindsEnum[]).map((value) => ({
	value,
	label: EventKinds[value].label,
}));
