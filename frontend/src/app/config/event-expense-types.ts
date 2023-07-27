import { EventExpenseTypesEnum } from "../api";

export interface EventExpenseTypesMetadata {
  title: string;
  color: string;
}

export const EventExpenseTypes: { [id in EventExpenseTypesEnum]: EventExpenseTypesMetadata } = {
  food: { title: "Potraviny", color: "primary" },
  transport: { title: "Doprava", color: "secondary" },
  material: { title: "Materiál", color: "dark" },
  accommodation: { title: "Ubytování", color: "dark" },
  other: { title: "Ostatní", color: "dark" },
};
