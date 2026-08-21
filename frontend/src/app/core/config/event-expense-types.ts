import { SDK } from "src/sdk";

export interface EventExpenseTypesMetadata {
	title: string;
	color: string;
}

export const EventExpenseTypes: { [id in SDK.EventExpenseTypesEnum]: EventExpenseTypesMetadata } = {
	food: { title: "Potraviny", color: "#799f3d" },
	transport: { title: "Doprava", color: "#e28f26" },
	material: { title: "Materiál", color: "#4a58b0" },
	accommodation: { title: "Ubytování", color: "#d2232a" },
	other: { title: "Ostatní", color: "#6b7185" },
};
