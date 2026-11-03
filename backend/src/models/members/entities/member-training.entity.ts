import { ApiHideProperty } from "@nestjs/swagger";
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

export enum MemberTrainingTypes {
	"zdravotnik" = "zdravotnik",
	"instruktorVodniTuristiky" = "instruktorVodniTuristiky",
	"lanac" = "lanac",
	"custom" = "custom",
}

@Entity("members_trainings")
export class MemberTraining {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	@Index("IDX_members_trainings_member_id")
	memberId!: number;

	@ManyToOne(() => Member, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	@ApiHideProperty()
	member?: Member;

	@Column({ type: "enum", enum: MemberTrainingTypes, nullable: false }) type!: MemberTrainingTypes;
	@Column({ type: "varchar", nullable: true }) name!: string | null;
	@Column({ type: "date", nullable: true }) issuedOn!: string | null;
	@Column({ type: "date", nullable: true }) validUntil!: string | null;
	@Column({ type: "varchar", nullable: true }) issuer!: string | null;
}
