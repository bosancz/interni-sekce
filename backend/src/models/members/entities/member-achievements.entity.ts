import { ApiHideProperty } from "@nestjs/swagger";
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

export enum MemberAchievementTypes {
	"novackovskaZkouska" = "novackovskaZkouska",
	"hvezda1" = "hvezda1",
	"hvezda2" = "hvezda2",
	"hvezda3" = "hvezda3",
	"hvezda4" = "hvezda4",
	"cernySan" = "cernySan",
	"clunar" = "clunar",
	"kormidelnik" = "kormidelnik",
	"lodivod" = "lodivod",
}

@Entity("members_achievements")
@Index("UQ_members_achievements_member_type", ["memberId", "type"], { unique: true })
export class MemberAchievement {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	memberId!: number;

	@ManyToOne(() => Member, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	@ApiHideProperty()
	member?: Member;

	@Column({ type: "enum", enum: MemberAchievementTypes, nullable: false }) type!: MemberAchievementTypes;
}
