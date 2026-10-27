import { join } from "path";
import { Event } from "../entities/event.entity";

export function getEventChroniclePath(eventsDir: string, event: Pick<Event, "id" | "srcId">): string {
	return join(eventsDir, event.srcId ?? String(event.id), "kronika.pdf");
}
