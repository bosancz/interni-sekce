import { Event } from "../database/entities/event.entity";
import { AccessControlGroup } from "./schema/access-control-list";

const events: AccessControlGroup<Event> = {
  events: {
    vedouci: true,
    clen: true,
    verejnost: true,
  },
  event: {
    vedouci: true,
    clen: true,
  },

  "event:attendees": {
    vedouci: true,
    clen: {
      permission: (params) => params.doc.id === 5,
      filter: { id: 5 },
    },
  },
};

export const ACL = {
  ...events,
};
