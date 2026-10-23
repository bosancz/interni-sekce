import { ApiHideProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Member } from "./member.entity";

@Entity("board_members")
export class BoardMember {
	@PrimaryColumn({ type: "integer" }) memberId!: number;
	@Column({ type: "varchar", nullable: false }) function!: string;
	@Column({ type: "integer", nullable: true }) position!: number | null;

	@ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	@ApiHideProperty()
	member?: Member;
}
