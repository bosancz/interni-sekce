import { EventsApi } from "src/app/api";
import { ExtractExisting } from "src/helpers/typings";

export type EventActions = ExtractExisting<
  keyof EventsApi,
  "publishEvent" | "unpublishEvent" | "uncancelEvent" | "cancelEvent" | "rejectEvent" | "submitEvent"
>;

// TODO: leadEvent
