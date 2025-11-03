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

	@Column({ type: "varchar", nullable: true }) receiptNumber?: string;
	@Column({ type: "numeric", nullable: true }) amount?: number;
	@Column({ type: "enum", enum: EventExpenseTypes, nullable: true }) type?: EventExpenseTypes;
	@Column({ type: "text", nullable: true }) description?: string;
}
