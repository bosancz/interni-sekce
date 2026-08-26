import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { AcEntity, WithLinks } from "src/access-control/access-control-lib";
import { NotificationSubscription } from "src/models/notifications/entities/notification-subscription.entity";
import { NotificationChannels, NotificationTypes } from "src/models/notifications/schema/notification-types";

export class NotificationTypeSettingResponse {
	@ApiProperty({ enum: NotificationTypes, enumName: "NotificationTypesEnum" }) type!: NotificationTypes;
	title!: string;
	description!: string;
	@ApiProperty({ enum: NotificationChannels, enumName: "NotificationChannelsEnum", isArray: true })
	channels!: NotificationChannels[];
}

export class NotificationSettingsResponse {
	pushEnabled!: boolean;
	@ApiProperty({ type: "string", nullable: true }) vapidPublicKey!: string | null;

	@AcEntity(NotificationTypeSettingResponse, { isArray: true })
	@ApiProperty({ type: WithLinks(NotificationTypeSettingResponse), isArray: true })
	types!: NotificationTypeSettingResponse[];
}

export class NotificationSettingUpdateBody {
	@ApiProperty({ enum: NotificationChannels, enumName: "NotificationChannelsEnum", isArray: true })
	@IsArray()
	@IsEnum(NotificationChannels, { each: true })
	channels!: NotificationChannels[];
}

export class NotificationDeviceResponse implements Omit<
	NotificationSubscription,
	"user" | "userId" | "endpoint" | "keyP256dh" | "keyAuth"
> {
	id!: number;
	deviceId!: string;
	deviceName!: string | null;
	createdAt!: Date;
	updatedAt!: Date;
}

export class NotificationSubscriptionKeysBody {
	@IsString() p256dh!: string;
	@IsString() auth!: string;
}

export class NotificationSubscribeBody {
	@IsString() deviceId!: string;
	@IsOptional() @IsString() deviceName?: string | null;
	@IsString() endpoint!: string;

	@ApiProperty({ type: NotificationSubscriptionKeysBody })
	@ValidateNested()
	@Type(() => NotificationSubscriptionKeysBody)
	keys!: NotificationSubscriptionKeysBody;
}
