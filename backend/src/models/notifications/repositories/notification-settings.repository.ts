import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { NotificationSetting } from "../entities/notification-setting.entity";
import { NotificationChannels, NotificationTypes } from "../schema/notification-types";

@Injectable()
export class NotificationSettingsRepository {
	constructor(@InjectRepository(NotificationSetting) private repository: Repository<NotificationSetting>) {}

	async getUserSettings(userId: number) {
		return this.repository.findBy({ userId });
	}

	async getUsersSettings(userIds: number[], type: NotificationTypes) {
		if (!userIds.length) return [];
		return this.repository.findBy({ userId: In(userIds), type });
	}

	async setSetting(userId: number, type: NotificationTypes, channels: NotificationChannels[]) {
		return this.repository.save({ userId, type, channels });
	}
}
