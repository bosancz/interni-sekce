import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Event } from "./event.entity";

@Entity("events_groups")
export class EventGroup {
  @PrimaryColumn()
  eventId!: number;

  @PrimaryColumn()
  groupId!: string;

  @ManyToOne(() => Event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event?: Event;

  @ManyToOne(() => EventGroup, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group?: EventGroup;
}
