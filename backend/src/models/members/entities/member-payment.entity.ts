import { ApiHideProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

@Entity("members_payment")
export class MemberPayment {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: false })
	memberId!: number;

	@ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	@ApiHideProperty()
	member?: Member;

	@Column({ type: "integer", nullable: false }) amount!: number;
	@Column({ type: "date", nullable: true }) paymentDate?: string | null;
}