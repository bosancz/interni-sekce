import { ApiHideProperty } from "@nestjs/swagger";
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Group } from "./group.entity";
import { Member } from "./member.entity";

@Entity("members_groups")
@Index("IDX_members_groups_active_member", ["memberId"], { unique: true, where: "active" })
@Check("CHK_members_groups_years", "year_till IS NULL OR year_till >= year_from")
@Check("CHK_members_groups_active_till", "NOT active OR year_till IS NULL")
export class GroupMembership {
	@PrimaryGeneratedColumn() id!: number;

	@Column()
	@Index("IDX_members_groups_member_id")
	memberId!: number;

	@Column()
	@Index("IDX_members_groups_group_id")
	groupId!: number;

	@Column({ type: "integer", nullable: true }) yearFrom!: number | null;
	@Column({ type: "integer", nullable: true }) yearTill!: number | null;
	@Column({ type: "boolean", default: false }) active!: boolean;

	@ManyToOne(() => Member, (member) => member.groupMemberships, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	@ApiHideProperty()
	member?: Member;

	@ManyToOne(() => Group, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
	@JoinColumn({ name: "group_id" })
	@ApiHideProperty()
	group?: Group;
}
