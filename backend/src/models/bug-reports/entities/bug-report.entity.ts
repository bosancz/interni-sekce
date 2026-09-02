import { User } from "src/models/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("bug_reports")
@Index(["repo", "issueNumber"], { unique: true })
export class BugReport {
	@PrimaryGeneratedColumn() id!: number;

	@Column() userId!: number;

	@ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user?: User;

	@Column({ type: "varchar" }) repo!: string;

	@Column({ type: "int" }) issueNumber!: number;

	@Column({ type: "varchar" }) title!: string;

	@CreateDateColumn({ type: "timestamp with time zone" }) createdAt!: Date;

	@Column({ type: "timestamp with time zone", nullable: true }) notifiedAt!: Date | null;
}
