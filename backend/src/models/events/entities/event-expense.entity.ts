import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Event } from "./event.entity";

// Účetní kategorie výdajů podle metodiky hospodáře. Pořadí je pořadí, ve kterém se
// kategorie nabízejí ve frontendu (abecedně podle českého názvu).
export enum EventExpenseTypes {
	"travelAllowance" = "travelAllowance",
	"transport" = "transport",
	"material" = "material",
	"other" = "other",
	"fuel" = "fuel",
	"food" = "food",
	"catering" = "catering",
	"accommodation" = "accommodation",
	"admission" = "admission",
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
