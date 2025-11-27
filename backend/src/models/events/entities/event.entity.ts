import { Album } from "src/models/albums/entities/album.entity";
import { Group } from "src/models/members/entities/group.entity";
import { Member } from "src/models/members/entities/member.entity";
import {
  AfterLoad,
  Column,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { EventAttendee, EventAttendeeType } from "./event-attendee.entity";
import { EventExpense } from "./event-expense.entity";

export enum EventStates {
  "draft" = "draft",
  "pending" = "pending",
  "public" = "public",
  "cancelled" = "cancelled",
}

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Album)
  album?: Album;

  @RelationId((event: Event) => event.groups)
  groupsIds!: number[];

  @ManyToMany(() => Group, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinTable({ name: "events_groups", joinColumn: { name: "event_id" }, inverseJoinColumn: { name: "group_id" } })
  groups?: Group[];

  @OneToMany(() => EventAttendee, (ea) => ea.event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  attendees?: EventAttendee[];

  @OneToMany(() => EventExpense, (expense) => expense.event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  expenses?: EventExpense[];

  @Column({ type: "text", nullable: false }) name!: string;
  @Column({ type: "enum", nullable: false, enum: EventStates, default: EventStates.draft }) status!: EventStates;
  @Column({ type: "text", nullable: true }) statusNote!: string | null;
  @Column({ type: "text", nullable: true }) place!: string | null;
  @Column({ type: "text", nullable: true }) description!: string | null;
  @Column({ type: "date", nullable: false }) dateFrom!: string;
  @Column({ type: "date", nullable: false }) dateTill!: string;
  @Column({ type: "varchar", nullable: true }) timeFrom!: string | null;
  @Column({ type: "varchar", nullable: true }) timeTill!: string | null;
  @Column({ type: "varchar", nullable: true }) meetingPlaceStart!: string | null;
  @Column({ type: "varchar", nullable: true }) meetingPlaceEnd!: string | null;
  @Column({ type: "varchar", nullable: true }) type!: string | null;
  @Column({ type: "numeric", nullable: true }) waterKm!: number | null;
  @Column({ type: "varchar", nullable: true }) river!: string | null;
  @Column({ type: "boolean", nullable: false, default: false }) leadersEvent!: boolean;
  @Column({ type: "boolean", nullable: false, default: false }) hasRegistration!: boolean;

  @DeleteDateColumn() deletedAt?: Date | null;

  leaders?: Member[];

  @AfterLoad()
  setLeaders() {
    this.leaders = this.attendees?.filter((a) => a.member && a.type === EventAttendeeType.leader).map((a) => a.member!);
  }
}
