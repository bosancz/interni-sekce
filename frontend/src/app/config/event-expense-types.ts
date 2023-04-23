import { EventExpenseResponseTypeEnum } from "../api";

export interface EventExpenseType {
  title: string;
  color: string;
}

export const EventExpenseTypes: { [id in EventExpenseResponseTypeEnum]: EventExpenseType } = {
  food: { title: "Potraviny", color: "primary" },
  transport: { title: "Doprava", color: "secondary" },
  material: { title: "Materiál", color: "dark" },
  accommodation: { title: "Ubytování", color: "dark" },
  other: { title: "Ostatní", color: "dark" },
};
