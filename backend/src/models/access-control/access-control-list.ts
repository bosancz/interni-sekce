import { Event } from "../events/entities/event.entity";
import { AccessControlEntity } from "./schema/access-control-list";

const event: AccessControlEntity<Event> = {
  vedouci: {
    route: true,
  },
  clen: {
    route: true,
    docs: (params) => params.doc.id === 5,
  },
};

const eventAttendees: AccessControlEntity<{ test: string }> = {
  vedouci: {
    route: true,
  },
  clen: {
    route: true,
    docs: (params) => params.doc.test === "a",
  },
};

export const ACL = {
  event: event,
  "event:attendees": eventAttendees,
};
