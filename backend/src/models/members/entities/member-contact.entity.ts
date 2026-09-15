import { ApiHideProperty } from "@nestjs/swagger";
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

@Entity("members_contacts")
export class MemberContact {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: false })
	memberId!: number;

	@ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	@ApiHideProperty()
	member?: Member;

	@Column({ type: "varchar", nullable: false }) relationship!: string;
	@Column({ type: "varchar", nullable: true }) name?: string;
	@Column({ type: "varchar", array: true, nullable: false, default: () => "'{}'" }) mobile!: string[];
	@Column({ type: "varchar", array: true, nullable: false, default: () => "'{}'" }) email!: string[];
	@Column({ type: "text", nullable: true }) other?: string;
	@Column({ type: "boolean", nullable: false, default: false }) isDefault!: boolean;

	@Index("IDX_members_contacts_search_vector", { synchronize: false })
	@Column({
		type: "tsvector",
		nullable: true,
		select: false,
		asExpression:
			"to_tsvector('simple_unaccent', coalesce(name, '') || ' ' || regexp_replace(regexp_replace(immutable_array_to_string(mobile, ', '), '(?<=[[:digit:]])[[:space:]-]+(?=[[:digit:]])', '', 'g'), '([+]|00)420', '', 'g') || ' ' || translate(immutable_array_to_string(email, ', '), '@._+-', '     '))",
		generatedType: "STORED",
	})
	@ApiHideProperty()
	searchVector?: string;
}
