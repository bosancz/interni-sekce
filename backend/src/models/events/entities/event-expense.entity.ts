import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Event } from "./event.entity";

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
  @Column({ type: "varchar" }) type!: string | null;
  @Column({ type: "text" }) description!: string | null;
}
