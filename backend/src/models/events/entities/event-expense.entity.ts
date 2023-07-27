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
  id!: string;

  @Column()
  eventId!: number;

  @ManyToOne(() => Event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event?: Event;

  @Column({ type: "numeric" }) amount!: number | null;
  @Column({ type: "enum", enum: EventExpenseTypes }) type!: EventExpenseTypes | null;
  @Column({ type: "text" }) description!: string | null;
}
