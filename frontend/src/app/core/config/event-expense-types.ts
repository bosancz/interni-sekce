import { SDK } from "src/sdk";

export interface EventExpenseTypesMetadata {
	title: string;
	color: string;
	/** Co do kategorie patří — zobrazuje se v nápovědě u účtování. */
	description: string;
}

// Účetní kategorie výdajů podle metodiky hospodáře, řazené abecedně podle názvu.
// Barvy jsou sladěné s brandem (chipy + graf výdajů).
export const EventExpenseTypes: { [id in SDK.EventExpenseTypesEnum]: EventExpenseTypesMetadata } = {
	travelAllowance: {
		title: "Cestovní náhrady",
		color: "#8e6bb0",
		description: "Cestovní příkazy za soukromá auta.",
	},
	transport: {
		title: "Doprava",
		color: "#e28f26",
		description: "Hromadná doprava — bus, vlak.",
	},
	material: {
		title: "Materiál",
		color: "#4a58b0",
		description: "Nákup materiálu.",
	},
	other: {
		title: "Ostatní služby",
		color: "#6b7185",
		description: "Zapůjčení lodí, zapůjčení vleku, pronájem kanálu, skipasy, lékařská pohotovost atd.",
	},
	fuel: {
		title: "PHM auto",
		color: "#a0642a",
		description: "Nafta do skupinového auta.",
	},
	food: {
		title: "Potraviny",
		color: "#799f3d",
		description: "Nákup potravin.",
	},
	catering: {
		title: "Stravování",
		color: "#3f9e8c",
		description: "Jídlo jako služba, restaurace.",
	},
	accommodation: {
		title: "Ubytování",
		color: "#d2232a",
		description: "Kempy, chaty.",
	},
	admission: {
		title: "Vstupné",
		color: "#c2286f",
		description: "Startovné, splavenky, vstupenky do kina, muzea atd.",
	},
};
