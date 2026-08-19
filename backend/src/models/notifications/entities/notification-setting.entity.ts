import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/models/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { NotificationChannels, NotificationTypes } from "../schema/notification-types";

@Entity("notification_settings")
export class NotificationSetting {
	@PrimaryColumn()
	userId!: number;

	@ManyToOne(() => User, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user?: User;

	@PrimaryColumn({ type: "enum", enum: NotificationTypes })
	@ApiProperty({ enum: NotificationTypes, enumName: "NotificationTypesEnum" })
	type!: NotificationTypes;

	@Column({ type: "enum", enum: NotificationChannels })
	@ApiProperty({ enum: NotificationChannels, enumName: "NotificationChannelsEnum" })
	channel!: NotificationChannels;
}
