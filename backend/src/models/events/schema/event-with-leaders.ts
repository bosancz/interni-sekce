import { Event } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";

export type EventWithLeaders = Event & { leaders: Member[] };
