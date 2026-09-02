import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

@Entity("groups")
export class Group {
	@PrimaryGeneratedColumn() id!: number;

	@Column({ type: "text", nullable: true, collation: "natural_numeric" }) name!: string | null;
	@Column({ type: "varchar", nullable: false }) shortName!: string;
	@Column({ type: "boolean", nullable: false, default: true }) active!: boolean;
	@Column({ type: "boolean", nullable: false, default: true }) children!: boolean;
	@Column({ type: "varchar", nullable: true }) color!: string | null;
	@Column({ type: "varchar", nullable: true }) darkColor!: string | null;

	@DeleteDateColumn() deletedAt!: string | null;

	@OneToMany(() => Member, (member) => member.group) members?: Member[];
}
