import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { Notification } from "../entities/notification.entity";
import { NotificationTypes } from "../schema/notification-types";

export interface NotificationData {
	userId: number;
	type: NotificationTypes;
	title: string;
	body: string | null;
	path: string | null;
}

@Injectable()
export class NotificationsRepository {
	constructor(@InjectRepository(Notification) private repository: Repository<Notification>) {}

	async createNotifications(notifications: NotificationData[]) {
		if (!notifications.length) return;
		await this.repository.insert(notifications);
	}

	async listNotifications(userId: number, limit = 100) {
		return this.repository.find({
			where: { userId },
			order: { createdAt: "DESC", id: "DESC" },
			take: limit,
		});
	}

	async getNotification(userId: number, id: number) {
		return this.repository.findOne({ where: { userId, id } });
	}

	async markRead(userId: number, id: number) {
		await this.repository.update({ userId, id, readAt: IsNull() }, { readAt: new Date() });
	}

	async markAllRead(userId: number) {
		await this.repository.update({ userId, readAt: IsNull() }, { readAt: new Date() });
	}
}
