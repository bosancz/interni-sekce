import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

@Entity("groups")
export class Group {
	@PrimaryGeneratedColumn() id!: number;

	// `natural_numeric` is an ICU collation with numeric ordering, so group names with
	// embedded numbers sort naturally ("3. oddíl" before "22. oddíl") wherever the column
	// is ordered — e.g. sorting members by their group in the members list.
	@Column({ type: "text", nullable: true, collation: "natural_numeric" }) name!: string | null;
	@Column({ type: "varchar", nullable: false }) shortName!: string;
	@Column({ type: "boolean", nullable: false, default: true }) active!: boolean;
	@Column({ type: "varchar", nullable: true }) color!: string | null;
	@Column({ type: "varchar", nullable: true }) darkColor!: string | null;

	@DeleteDateColumn() deletedAt!: string | null;

	@OneToMany(() => Member, (member) => member.group) members?: Member[];
}
