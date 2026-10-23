import { ApiHideProperty } from "@nestjs/swagger";
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

export enum GroupMeetingDays {
	monday = "monday",
	tuesday = "tuesday",
	wednesday = "wednesday",
	thursday = "thursday",
	friday = "friday",
}

@Entity("groups")
export class Group {
	@PrimaryGeneratedColumn() id!: number;

	@Column({ type: "text", nullable: true, collation: "natural_numeric" }) name!: string | null;
	@Column({ type: "varchar", nullable: false, unique: true }) shortName!: string;
	@Column({ type: "boolean", nullable: false, default: true }) active!: boolean;
	@Column({ type: "boolean", nullable: false, default: true }) children!: boolean;
	@Column({ type: "varchar", nullable: true }) color!: string | null;
	@Column({ type: "varchar", nullable: true }) darkColor!: string | null;
	@Column({ type: "timestamp with time zone", nullable: true }) profilePhotoUpdatedAt!: Date | null;
	@Column({ type: "enum", enum: GroupMeetingDays, nullable: true }) meetingDay!: GroupMeetingDays | null;
	@Column({ type: "integer", nullable: true }) leaderId!: number | null;

	@DeleteDateColumn() deletedAt!: string | null;

	@OneToMany(() => Member, (member) => member.group) members?: Member[];

	@ManyToOne(() => Member, { onDelete: "SET NULL", onUpdate: "CASCADE" })
	@JoinColumn({ name: "leader_id" })
	@ApiHideProperty()
	leader?: Member | null;
}
