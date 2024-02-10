import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Event } from "./event.entity";

export enum EventExpenseTypes {
  "food" = "food",
  "transport" = "transport",
  "material" = "material",
  "accommodation" = "accommodation",
  "other" = "other",
}

@Entity("events_expenses")
export class EventExpense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eventId!: number;

  @ManyToOne(() => Event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event?: Event;

  @Column({ type: "varchar", nullable: false }) receiptNumber!: string;
  @Column({ type: "numeric", nullable: false }) amount!: number;
  @Column({ type: "enum", enum: EventExpenseTypes, nullable: false }) type!: EventExpenseTypes;
  @Column({ type: "text", nullable: false }) description!: string;
}
