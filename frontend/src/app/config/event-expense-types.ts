export interface EventExpenseTypesMetadata {
	title: string;
	color: string;
}

export const EventExpenseTypes: { [id in BackendApiTypes.EventExpenseTypesEnum]: EventExpenseTypesMetadata } = {
	food: { title: "Potraviny", color: "#4caf50" },
	transport: { title: "Doprava", color: "#ff9800" },
	material: { title: "Materiál", color: "#2196f3" },
	accommodation: { title: "Ubytování", color: "#9c27b0" },
	other: { title: "Ostatní", color: "#607d8b" },
};
