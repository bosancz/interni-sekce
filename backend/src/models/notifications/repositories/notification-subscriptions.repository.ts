import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { NotificationSubscription } from "../entities/notification-subscription.entity";

export interface SubscriptionData {
	deviceId: string;
	deviceName: string | null;
	endpoint: string;
	keyP256dh: string;
	keyAuth: string;
}

@Injectable()
export class NotificationSubscriptionsRepository {
	constructor(
		@InjectRepository(NotificationSubscription) private repository: Repository<NotificationSubscription>,
	) {}

	async listDevices(userId: number) {
		return this.repository.find({ where: { userId }, order: { createdAt: "ASC" } });
	}

	async getDevice(userId: number, id: number) {
		return this.repository.findOne({ where: { userId, id } });
	}

	async upsertSubscription(userId: number, data: SubscriptionData) {
		// the endpoint is globally unique — when a device re-subscribes under another account or
		// with a fresh deviceId, the stale row would collide with the upsert below
		await this.repository
			.createQueryBuilder()
			.delete()
			.where("endpoint = :endpoint AND NOT (user_id = :userId AND device_id = :deviceId)", {
				endpoint: data.endpoint,
				userId,
				deviceId: data.deviceId,
			})
			.execute();

		await this.repository.upsert({ userId, ...data }, ["userId", "deviceId"]);

		return this.repository.findOneOrFail({ where: { userId, deviceId: data.deviceId } });
	}

	async deleteDevice(userId: number, id: number) {
		return this.repository.delete({ userId, id });
	}

	async deleteSubscription(id: number) {
		return this.repository.delete(id);
	}

	async getSendableDevice(userId: number, id: number) {
		return this.repository.findOne({
			select: { id: true, userId: true, deviceId: true, deviceName: true, endpoint: true, keyP256dh: true, keyAuth: true },
			where: { userId, id },
		});
	}

	async getSendableSubscriptions(userIds: number[]) {
		if (!userIds.length) return [];
		return this.repository.find({
			select: { id: true, userId: true, endpoint: true, keyP256dh: true, keyAuth: true },
			where: { userId: In(userIds) },
		});
	}
}
