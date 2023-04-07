import { Pipe, PipeTransform } from "@angular/core";
import { EventResponse } from "src/app/api";
import { EventTypes } from "src/app/config/event-types";

type EventPipeProperty = "image" | "color" | "class";

@Pipe({
  name: "event",
  pure: false,
})
export class EventPipe implements PipeTransform {
  eventTypes = EventTypes;

  defaultProperties: { [property: string]: any } = {};

  constructor() {}

  transform(event: EventResponse | undefined, property: EventPipeProperty): string {
    if (!event) return this.defaultProperties[property];

    switch (property) {
      case "color":
      case "image":
        return event.type && event.type in this.eventTypes
          ? this.eventTypes[<keyof typeof this.eventTypes>event.type][property] ?? ""
          : "";

      default:
        return "?";
    }
  }
}
