import { Group } from "src/models/members/entities/group.entity";
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Event } from "./event.entity";

// The events<->groups join table is mapped explicitly by this entity only. Do not add a
// @ManyToMany/@JoinTable over "events_groups" as well — two metadata objects for one table make
// the schema builder drop and recreate the FK indexes in every generated migration.
@Entity("events_groups")
export class EventGroup {
	@PrimaryColumn()
	@Index()
	eventId!: number;

	@PrimaryColumn()
	@Index()
	groupId!: number;

	@ManyToOne(() => Event, (event) => event.eventGroups, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "event_id" })
	event?: Event;

	@ManyToOne(() => Group, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "group_id" })
	group?: Group;
}
