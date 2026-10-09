import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Member } from "src/models/members/entities/member.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BadgeTypes } from "../schema/badge-types";

@Entity("members_badges")
@Index(["memberId", "badge", "level"], { unique: true })
export class MemberBadge {
	@PrimaryGeneratedColumn() id!: number;

	@Column() memberId!: number;

	@ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	@ApiHideProperty()
	member?: Member;

	@Column({ type: "varchar" })
	@ApiProperty({ enum: BadgeTypes, enumName: "BadgeTypesEnum" })
	badge!: BadgeTypes;

	@Column({ type: "integer" }) level!: number;

	@Column({ type: "timestamp with time zone", default: () => "now()" }) earnedAt!: Date;

	@Column({ type: "timestamp with time zone", nullable: true }) seenAt!: Date | null;
}
