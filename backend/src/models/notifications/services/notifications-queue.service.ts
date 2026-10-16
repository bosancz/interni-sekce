import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { JobsOptions, Queue } from "bullmq";
import { MailOptions } from "src/models/mail/schema/mail-options";
import { NOTIFICATIONS_QUEUE, NotificationJobs } from "../notifications-queue";

export interface NotificationEmailJob {
	mail: MailOptions;
}

export interface NotificationPushPayload {
	notification: { title: string; body?: string; data?: Record<string, unknown> };
}

export interface NotificationPushJob {
	subscriptionId: number;
	payload: NotificationPushPayload;
}

const JOB_OPTIONS: JobsOptions = {
	attempts: 6,
	backoff: { type: "exponential", delay: 30_000 },
	removeOnComplete: true,
	removeOnFail: 1000,
};

@Injectable()
export class NotificationsQueueService {
	constructor(@InjectQueue(NOTIFICATIONS_QUEUE) private queue: Queue) {}

	async enqueueEmails(mails: MailOptions[]) {
		if (!mails.length) return;
		await this.queue.addBulk(
			mails.map((mail) => ({
				name: NotificationJobs.email,
				data: { mail } satisfies NotificationEmailJob,
				opts: JOB_OPTIONS,
			})),
		);
	}

	async enqueuePush(pushes: NotificationPushJob[]) {
		if (!pushes.length) return;
		await this.queue.addBulk(
			pushes.map(({ subscriptionId, payload }) => ({
				name: NotificationJobs.push,
				data: { subscriptionId, payload } satisfies NotificationPushJob,
				opts: JOB_OPTIONS,
			})),
		);
	}
}
