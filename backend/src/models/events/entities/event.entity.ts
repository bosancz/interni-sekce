import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Album } from "src/models/albums/entities/album.entity";
import { Group } from "src/models/members/entities/group.entity";
import { Member } from "src/models/members/entities/member.entity";
import {
	AfterLoad,
	Column,
	DeleteDateColumn,
	Entity,
	Index,
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

	@RelationId((event: Event) => event.groups)
	groupsIds!: number[];

	// events_groups is mapped *only* by this @JoinTable — there must be no @Entity("events_groups")
	// alongside it, or TypeORM builds two metadata objects for the table and every generated
	// migration drops and recreates its indexes.
	@ManyToMany(() => Group, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinTable({ name: "events_groups", joinColumn: { name: "event_id" }, inverseJoinColumn: { name: "group_id" } })
	groups?: Group[];

	@OneToMany(() => EventAttendee, (ea) => ea.event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	attendees?: EventAttendee[];

	@OneToMany(() => EventExpense, (expense) => expense.event, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	expenses?: EventExpense[];

	@Column({ type: "text", nullable: false }) name!: string;

	// Diacritic- and case-insensitive full-text vector, maintained by Postgres as a stored generated
	// column (see SearchVectorColumns migration). Matched with `searchVector @@ to_tsquery(...)`.
	// The GIN index is created in that migration; synchronize:false because TypeORM cannot express it.
	@Index("IDX_events_search_vector", { synchronize: false })
	@Column({
		type: "tsvector",
		nullable: true,
		select: false,
		asExpression: "to_tsvector('simple_unaccent', coalesce(name, ''))",
		generatedType: "STORED",
	})
	@ApiHideProperty()
	searchVector?: string;

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

	// Legacy Mongo ObjectId of the event, set only for events imported from the old server
	// (mongo-import). When present, the registration PDF lives in the legacy on-disk layout
	// (folder keyed by this ObjectId, file named registration.pdf) rather than the numeric-id
	// layout; see EventsRegistrationsController.registrationFolder.
	@Column({ type: "varchar", nullable: true }) srcId!: string | null;

	@DeleteDateColumn() deletedAt?: Date | null;

	leaders?: Member[];

	@AfterLoad()
	setLeaders() {
		this.leaders = this.attendees
			?.filter((a) => a.member && a.type === EventAttendeeType.leader)
			.map((a) => a.member!);
	}
}
