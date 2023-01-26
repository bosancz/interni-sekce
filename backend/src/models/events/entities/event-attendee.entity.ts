import { Member } from "src/models/members/entities/member.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Event } from "./event.entity";

export enum EventAttendeeType {
  "attendee" = "attendee",
  "leader" = "leader",
}

@Entity("events_attendees")
export class EventAttendee {
  @PrimaryColumn()
  eventId!: number;

  @PrimaryColumn()
  memberId!: number;

  @ManyToOne(() => Event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event?: Event;

  @ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member;

  @Column({ type: "enum", enum: EventAttendeeType, nullable: false }) type!: EventAttendeeType;
}
