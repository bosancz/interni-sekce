import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/models/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { NotificationTypes } from "../schema/notification-types";

@Entity("notifications")
@Index(["userId", "createdAt"])
export class Notification {
	@PrimaryGeneratedColumn() id!: number;

	@Column({ select: false }) userId!: number;

	@ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user?: User;

	@Column({ type: "enum", enum: NotificationTypes })
	@ApiProperty({ enum: NotificationTypes, enumName: "NotificationTypesEnum" })
	type!: NotificationTypes;

	@Column({ type: "varchar" }) title!: string;

	@Column({ type: "varchar", nullable: true }) body!: string | null;

	@Column({ type: "varchar", nullable: true }) path!: string | null;

	@CreateDateColumn({ type: "timestamp with time zone" }) createdAt!: Date;

	@Column({ type: "timestamp with time zone", nullable: true }) readAt!: Date | null;
}
