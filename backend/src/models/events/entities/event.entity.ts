import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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

  @OneToMany(() => EventGroup, (group) => group.event)
  groups!: EventGroup[];

  @OneToMany(() => EventAttendee, (ea) => ea.event)
  attendees!: EventAttendee[];

  @OneToMany(() => EventExpense, (expense) => expense.event)
  expenses!: EventExpense[];

  @Column({ type: "text", nullable: false }) name!: string;
  @Column({ nullable: false, enum: EventStatus, default: EventStatus.draft }) status!: EventStatus;
  @Column({ type: "text" }) statusNote!: string | null;
  @Column({ type: "text" }) place!: string | null;
  @Column({ type: "text" }) description!: string | null;
  @Column({ nullable: false }) dateFrom!: Date;
  @Column({ nullable: false }) dateTill!: Date;
  @Column({ type: "varchar" }) timeFrom!: string | null;
  @Column({ type: "varchar" }) timeTill!: string | null;
  @Column({ type: "varchar" }) meetingPlaceStart!: string | null;
  @Column({ type: "varchar" }) meetingPlaceEnd!: string | null;
  @Column({ type: "varchar" }) type!: string | null;
  @Column({ type: "numeric" }) water_km!: number | null;
  @Column({ type: "varchar" }) river!: string | null;
}
