import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job, UnrecoverableError } from "bullmq";
import { NotificationsDeliveryService } from "../services/notifications-delivery.service";
import { NotificationEmailJob, NotificationPushJob } from "../services/notifications-queue.service";
import { NOTIFICATIONS_QUEUE, NotificationJobs } from "../notifications-queue";

@Processor(NOTIFICATIONS_QUEUE, { concurrency: 5 })
export class NotificationsProcessor extends WorkerHost {
	private logger = new Logger(NotificationsProcessor.name);

	constructor(private notificationsDeliveryService: NotificationsDeliveryService) {
		super();
	}

	async process(job: Job) {
		try {
			switch (job.name) {
				case NotificationJobs.email: {
					const { mail } = job.data as NotificationEmailJob;
					return await this.notificationsDeliveryService.sendEmail(mail);
				}
				case NotificationJobs.push: {
					const { subscriptionId, payload } = job.data as NotificationPushJob;
					return await this.notificationsDeliveryService.sendPush(subscriptionId, payload);
				}
				default:
					this.logger.warn(`Unknown notification job "${job.name}".`);
			}
		} catch (err) {
			const status = getErrorStatus(err);
			if (status !== undefined && isPermanentStatus(status)) {
				const message = `Failed to send ${job.name} notification, not retrying (HTTP ${status}): ${(err as Error).message}`;
				this.logger.error(message);
				throw new UnrecoverableError(message);
			}

			const attempts = job.opts.attempts ?? 1;
			const message = `Failed to send ${job.name} notification (attempt ${job.attemptsMade + 1}/${attempts}): ${(err as Error).message}`;
			if (job.attemptsMade + 1 >= attempts) this.logger.error(message);
			else this.logger.warn(message);
			throw err;
		}
	}
}

const RETRYABLE_CLIENT_STATUSES = [401, 403, 408, 429];

function isPermanentStatus(status: number) {
	return status >= 400 && status < 500 && !RETRYABLE_CLIENT_STATUSES.includes(status);
}

function getErrorStatus(err: unknown): number | undefined {
	if (!err || typeof err !== "object") return undefined;
	const error = err as { statusCode?: unknown; status?: unknown; response?: { status?: unknown } };
	const status = error.statusCode ?? error.status ?? error.response?.status;
	return typeof status === "number" ? status : undefined;
}
