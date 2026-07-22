import { ApiProperty } from "@nestjs/swagger";
import { Album } from "src/models/albums/entities/album.entity";
import { Member } from "src/models/members/entities/member.entity";
import { AfterLoad, Column, DeleteDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { EventAttendee, EventAttendeeType } from "./event-attendee.entity";
import { EventGroup } from "./event-group.entity";
import { EventExpense } from "./event-expense.entity";

export enum EventStates {
	"draft" = "draft",
	"pending" = "pending",
	"public" = "public",
	"cancelled" = "cancelled",
}

export class EventPlaceGeometry {
	type!: "Point";
	@ApiProperty({ type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 })
	coordinates!: [number, number];
}

@Entity("events")
export class Event {
	@PrimaryGeneratedColumn()
	id!: number;

	@OneToOne(() => Album, (album) => album.event)
	album?: Album;

	// The events<->groups membership. The join table is mapped explicitly (EventGroup), so this is
	// the single source of truth for an event's groups — reads join it, writes go through
	// EventsRepository.updateEventGroups(). Consumers read the group ids off eventGroups[].groupId.
	@OneToMany(() => EventGroup, (eventGroup) => eventGroup.event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	eventGroups?: EventGroup[];

	@OneToMany(() => EventAttendee, (ea) => ea.event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	attendees?: EventAttendee[];

	@OneToMany(() => EventExpense, (expense) => expense.event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	expenses?: EventExpense[];

	@Column({ type: "text", nullable: false }) name!: string;
	@Column({ type: "enum", nullable: false, enum: EventStates, default: EventStates.draft }) status!: EventStates;
	@Column({ type: "text", nullable: true }) statusNote!: string | null;
	@Column({ type: "text", nullable: true }) place!: string | null;
	@Column({ type: "geometry", spatialFeatureType: "Point", srid: 4326, nullable: true })
	placeGeometry!: EventPlaceGeometry | null;
	@Column({ type: "text", nullable: true }) description!: string | null;
	@Column({ type: "integer", nullable: true }) price!: number | null;
	@Column({ type: "text", nullable: true }) itemList!: string | null;
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
	@Column({ type: "varchar", nullable: true }) report!: string | null;

	@DeleteDateColumn() deletedAt?: Date | null;

	leaders?: Member[];

	@AfterLoad()
	setLeaders() {
		this.leaders = this.attendees
			?.filter((a) => a.member && a.type === EventAttendeeType.leader)
			.map((a) => a.member!);
	}
}
