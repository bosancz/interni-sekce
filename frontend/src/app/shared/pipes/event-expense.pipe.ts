import { Pipe, PipeTransform } from "@angular/core";
import { EventExpenseResponseWithLinks } from "src/app/api";
import { EventExpenseTypes } from "src/app/config/event-expense-types";
import { EventTypes } from "src/app/config/event-types";

type EventExpensePipeProperty = "type" | "color";

@Pipe({
  name: "eventExpense",
  pure: true,
})
export class EventExpensePipe implements PipeTransform {
  eventTypes = EventTypes;

  defaultProperties: { [property: string]: any } = {};

  constructor() {}

  transform(eventExpense: EventExpenseResponseWithLinks | undefined, property: EventExpensePipeProperty): string {
    if (!eventExpense) return this.defaultProperties[property];
    if (!(eventExpense.type in EventExpenseTypes)) return this.defaultProperties[property];

    switch (property) {
      case "type":
        return EventExpenseTypes[eventExpense.type].title;

      case "color":
        return EventExpenseTypes[eventExpense.type].color;

      default:
        throw new Error(`Unknown property ${property}`);
    }
  }
}
