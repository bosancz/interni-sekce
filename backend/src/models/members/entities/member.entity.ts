import { ApiHideProperty } from "@nestjs/swagger";
import { MEMBERSHIP_YEARS_COUNT } from "src/helpers/membership";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { User } from "src/models/users/entities/user.entity";
import {
	Column,
	DeleteDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Group } from "./group.entity";
import { MemberAchievement } from "./member-achievements.entity";
import { MemberContact } from "./member-contact.entity";

import { MemberPayment } from "./member-payment.entity";

export enum MemberRoles {
	"dite" = "dite",
	"instruktor" = "instruktor",
	"vedouci" = "vedouci",
}

// FIXME:
export enum MemberRanks {
	"dite" = "dite",
	"instruktor" = "instruktor",
	"vedouci" = "vedouci",
}

export enum HealthSeverity {
	"unknown" = "unknown",
	"low" = "low",
	"medium" = "medium",
	"high" = "high",
}

export interface HealthEntry {
	name: string;
	severity: HealthSeverity;
}

@Entity("members")
export class Member {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: false }) groupId!: Group["id"];
	@Column({ type: "varchar", nullable: false }) nickname!: string;
	@Column({ type: "enum", enum: MemberRoles, nullable: false }) role!: MemberRoles;
	@Column({ type: "boolean", nullable: false, default: true }) active!: boolean;
	// Membership fee per year: index 0 is MEMBERSHIP_FIRST_YEAR, preallocated up to
	// MEMBERSHIP_LAST_YEAR, `true` = paid ("zaplaceno"). Read it through isMembershipPaid()
	// (helpers/membership.ts) rather than indexing it here and there.
	@Column({
		type: "boolean",
		array: true,
		nullable: false,
		default: () => `array_fill(false, ARRAY[${MEMBERSHIP_YEARS_COUNT}])`,
	})
	membership!: boolean[];

	@Column({ type: "enum", enum: MemberRanks, nullable: true }) rank?: MemberRanks | null;
	@Column({ type: "varchar", nullable: true }) function?: string | null;
	@Column({ type: "varchar", nullable: true }) firstName?: string | null;
	@Column({ type: "varchar", nullable: true }) lastName?: string | null;

	// Diacritic- and case-insensitive full-text vector, maintained by Postgres as a stored generated
	// column (see SearchVectorColumns migration). Matched with `searchVector @@ to_tsquery(...)`.
	// The GIN index is created in that migration; synchronize:false because TypeORM cannot express it.
	@Index("IDX_members_search_vector", { synchronize: false })
	@Column({
		type: "tsvector",
		nullable: true,
		select: false,
		asExpression:
			"to_tsvector('simple_unaccent', coalesce(nickname, '') || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, ''))",
		generatedType: "STORED",
	})
	@ApiHideProperty()
	searchVector?: string;
	@Column({ type: "date", nullable: true }) birthday?: string | null;
	@Column({ type: "varchar", nullable: true }) addressStreet?: string | null;
	@Column({ type: "varchar", nullable: true }) addressStreetNo?: string | null;
	@Column({ type: "varchar", nullable: true }) addressCity?: string | null;
	@Column({ type: "varchar", nullable: true }) addressPostalCode?: string | null;
	@Column({ type: "varchar", nullable: true }) addressCountry?: string | null;
	@Column({ type: "varchar", nullable: true }) mobile?: string | null;
	@Column({ type: "varchar", nullable: true }) email?: string | null;
	@Column({ type: "jsonb", nullable: true }) knownProblems?: HealthEntry[] | null;
	@Column({ type: "jsonb", nullable: true }) allergies?: HealthEntry[] | null;
	@Column({ type: "varchar", nullable: true }) insuranceCardFile?: string | null;

	@DeleteDateColumn() deletedAt?: Date;

	@ManyToOne(() => Group, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
	@JoinColumn({ name: "group_id" })
	@ApiHideProperty()
	group?: Group;

	@OneToMany(() => MemberContact, (mb) => mb.member)
	contacts?: MemberContact[];

	@OneToMany(() => MemberPayment, (mb) => mb.member)
	payments?: MemberPayment[];

	@OneToMany(() => MemberAchievement, (mb) => mb.member)
	achievements?: MemberAchievement[];

	@OneToMany(() => EventAttendee, (ea) => ea.member)
	eventAttendees?: EventAttendee[];

	@OneToOne(() => User, (user) => user.member)
	user?: User;
}
