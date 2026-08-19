import {
	BadGatewayException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	ParseEnumPipe,
	ParseIntPipe,
	Post,
	Put,
	Req,
	Res,
	ServiceUnavailableException,
} from "@nestjs/common";
import { ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { OptionsStore } from "src/access-control/access-control-lib/options-store";
import { AuthUser } from "src/auth/decorators/auth-user.decorator";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { SessionUser } from "src/auth/schema/user-token";
import { NotificationSettingsRepository } from "src/models/notifications/repositories/notification-settings.repository";
import { NotificationSubscriptionsRepository } from "src/models/notifications/repositories/notification-subscriptions.repository";
import { PushService } from "src/models/notifications/services/push.service";
import {
	normalizeNotificationChannels,
	NotificationTypes,
	NotificationTypesMetadata,
} from "src/models/notifications/schema/notification-types";
import {
	NotificationDeviceDeletePermission,
	NotificationDeviceSubscribePermission,
	NotificationDevicesListPermission,
	NotificationDeviceTestPermission,
	NotificationSettingsReadPermission,
	NotificationSettingUpdatePermission,
} from "../acl/notifications.acl";
import {
	NotificationDeviceResponse,
	NotificationSettingsResponse,
	NotificationSettingUpdateBody,
	NotificationSubscribeBody,
} from "../dto/notifications.dto";

@Controller("account/notifications")
@Authenticated()
@AcController()
@ApiTags("Notifications")
export class AccountNotificationsController {
	constructor(
		private subscriptions: NotificationSubscriptionsRepository,
		private settings: NotificationSettingsRepository,
		private push: PushService,
	) {}

	@Get()
	@AcLinks(NotificationSettingsReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(NotificationSettingsResponse) })
	async getNotificationSettings(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
	): Promise<NotificationSettingsResponse> {
		NotificationSettingsReadPermission.canOrThrow(req);

		const settings = await this.settings.getUserSettings(authUser.userId);
		const userRoles = OptionsStore.getUserRoles(req);

		const types = Object.entries(NotificationTypesMetadata)
			.filter(([, metadata]) => !metadata.roles || metadata.roles.some((role) => userRoles.includes(role)))
			.map(([type, metadata]) => ({
				type: <NotificationTypes>type,
				title: metadata.title,
				description: metadata.description,
				channels: settings.find((setting) => setting.type === type)?.channels ?? metadata.defaultChannels,
			}));

		return {
			pushEnabled: this.push.isConfigured,
			vapidPublicKey: this.push.publicKey,
			types,
		};
	}

	@Put("settings/:notificationType")
	@HttpCode(204)
	@AcLinks(NotificationSettingUpdatePermission)
	@ApiParam({ name: "notificationType", enum: NotificationTypes, enumName: "NotificationTypesEnum" })
	@ApiResponse({ status: 204 })
	async updateNotificationSetting(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
		@Param("notificationType", new ParseEnumPipe(NotificationTypes)) notificationType: NotificationTypes,
		@Body() body: NotificationSettingUpdateBody,
	): Promise<void> {
		NotificationSettingUpdatePermission.canOrThrow(req, { type: notificationType } as never);

		await this.settings.setSetting(authUser.userId, notificationType, normalizeNotificationChannels(body.channels));
	}

	@Get("devices")
	@AcLinks(NotificationDevicesListPermission)
	@ApiResponse({ status: 200, type: WithLinks(NotificationDeviceResponse), isArray: true })
	async listNotificationDevices(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
	): Promise<NotificationDeviceResponse[]> {
		NotificationDevicesListPermission.canOrThrow(req);

		return this.subscriptions.listDevices(authUser.userId);
	}

	@Post("devices")
	@AcLinks(NotificationDeviceSubscribePermission)
	@ApiResponse({ status: 201, type: WithLinks(NotificationDeviceResponse) })
	async subscribeNotificationDevice(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
		@Body() body: NotificationSubscribeBody,
		@Res({ passthrough: true }) res: Response,
	): Promise<NotificationDeviceResponse> {
		NotificationDeviceSubscribePermission.canOrThrow(req);

		const device = await this.subscriptions.upsertSubscription(authUser.userId, {
			deviceId: body.deviceId,
			deviceName: body.deviceName ?? null,
			endpoint: body.endpoint,
			keyP256dh: body.keys.p256dh,
			keyAuth: body.keys.auth,
		});

		res.status(201);
		return device;
	}

	@Post("devices/:deviceId/test")
	@HttpCode(204)
	@AcLinks(NotificationDeviceTestPermission)
	@ApiResponse({ status: 204 })
	async testNotificationDevice(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
		@Param("deviceId", ParseIntPipe) deviceId: number,
	): Promise<void> {
		const device = await this.subscriptions.getSendableDevice(authUser.userId, deviceId);
		if (!device) throw new NotFoundException();

		NotificationDeviceTestPermission.canOrThrow(req, device);

		if (!this.push.isConfigured) throw new ServiceUnavailableException("Push notifications are not configured.");

		let alive: boolean;
		try {
			alive = await this.push.send(
				{ endpoint: device.endpoint!, keyP256dh: device.keyP256dh!, keyAuth: device.keyAuth! },
				{ title: "Zkušební upozornění", body: "Upozornění na tomto zařízení fungují." },
			);
		} catch (err) {
			throw new BadGatewayException(`Failed to send the test notification: ${(err as Error).message}`);
		}

		if (!alive) {
			await this.subscriptions.deleteSubscription(device.id);
			throw new NotFoundException("The subscription has expired and was removed.");
		}
	}

	@Delete("devices/:deviceId")
	@HttpCode(204)
	@AcLinks(NotificationDeviceDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteNotificationDevice(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
		@Param("deviceId", ParseIntPipe) deviceId: number,
	): Promise<void> {
		const device = await this.subscriptions.getDevice(authUser.userId, deviceId);
		if (!device) throw new NotFoundException();

		NotificationDeviceDeletePermission.canOrThrow(req, device);

		await this.subscriptions.deleteDevice(authUser.userId, deviceId);
	}
}
