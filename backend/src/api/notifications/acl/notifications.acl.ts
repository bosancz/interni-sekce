import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import {
	NotificationDeviceResponse,
	NotificationSettingsResponse,
	NotificationTypeSettingResponse,
} from "../dto/notifications.dto";

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
