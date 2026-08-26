import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import {
	NotificationDeviceResponse,
	NotificationResponse,
	NotificationSettingsResponse,
	NotificationTypeSettingResponse,
} from "../dto/notifications.dto";

export const NotificationsListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: NotificationResponse,

	allowed: {
		uzivatel: true,
	},
});

export const NotificationReadPermission = new Permission<NotificationResponse>({
	linkTo: NotificationResponse,
	params: { notificationId: "id" },

	allowed: {
		uzivatel: true,
	},
});

export const NotificationsReadAllPermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		uzivatel: true,
	},
});

export const NotificationSettingsReadPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: NotificationSettingsResponse,

	allowed: {
		uzivatel: true,
	},
});

export const NotificationSettingUpdatePermission = new Permission<NotificationTypeSettingResponse>({
	linkTo: NotificationTypeSettingResponse,
	params: { notificationType: "type" },

	allowed: {
		uzivatel: true,
	},
});

export const NotificationDevicesListPermission = new Permission<void>({
	linkTo: NotificationSettingsResponse,
	contains: NotificationDeviceResponse,

	allowed: {
		uzivatel: true,
	},
});

export const NotificationDeviceSubscribePermission = new Permission<void>({
	linkTo: NotificationSettingsResponse,
	contains: NotificationDeviceResponse,

	allowed: {
		uzivatel: true,
	},
});

export const NotificationDeviceTestPermission = new Permission<NotificationDeviceResponse>({
	linkTo: NotificationDeviceResponse,
	params: { deviceId: "id" },

	allowed: {
		uzivatel: true,
	},
});

export const NotificationDeviceDeletePermission = new Permission<NotificationDeviceResponse>({
	linkTo: NotificationDeviceResponse,
	params: { deviceId: "id" },

	allowed: {
		uzivatel: true,
	},
});
