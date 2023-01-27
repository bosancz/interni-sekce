import { Album } from "src/models/albums/entities/album.entity";
import { Member } from "src/models/members/entities/member.entity";
import { Column, DeleteDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { EventAttendee } from "./event-attendee.entity";
import { EventExpense } from "./event-expense.entity";
import { EventGroup } from "./event-group.entity";

export enum EventStatus {
  "draft" = "draft",
  "pending" = "pending",
  "public" = "public",
  "cancelled" = "cancelled",
  "rejected" = "rejected",
}

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Album)
  album?: Album;

  @OneToMany(() => EventGroup, (group) => group.event)
  groups?: EventGroup[];

  @OneToMany(() => EventAttendee, (ea) => ea.event)
  attendees?: EventAttendee[];

  @OneToMany(() => EventExpense, (expense) => expense.event)
  expenses?: EventExpense[];

  @Column({ type: "text", nullable: false }) name!: string;
  @Column({ type: "enum", nullable: false, enum: EventStatus, default: EventStatus.draft }) status!: EventStatus;
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
  @Column({ type: "numeric", nullable: true }) water_km!: number | null;
  @Column({ type: "varchar", nullable: true }) river!: string | null;
  @Column({ type: "boolean", nullable: false, default: false }) leadersEvent!: boolean;

  @DeleteDateColumn()
  deletedAt?: Date;

  leaders?: Member[];
  leadersAttendees?: EventAttendee[];
}
