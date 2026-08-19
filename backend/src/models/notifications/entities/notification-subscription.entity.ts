import { ApiHideProperty } from "@nestjs/swagger";
import { User } from "src/models/users/entities/user.entity";
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique,
	UpdateDateColumn,
} from "typeorm";

@Entity("notification_subscriptions")
@Unique(["userId", "deviceId"])
export class NotificationSubscription {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	userId!: number;

	@ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user?: User;

	@Column({ type: "varchar" }) deviceId!: string;
	@Column({ type: "varchar", nullable: true }) deviceName!: string | null;

	// The endpoint is a capability URL and the keys encrypt the payloads for the device,
	// so none of them ever leaves the backend.
	@Column({ type: "text", unique: true, select: false }) @ApiHideProperty() endpoint?: string;
	@Column({ type: "text", select: false }) @ApiHideProperty() keyP256dh?: string;
	@Column({ type: "text", select: false }) @ApiHideProperty() keyAuth?: string;

	@CreateDateColumn() createdAt!: Date;
	@UpdateDateColumn() updatedAt!: Date;
}
