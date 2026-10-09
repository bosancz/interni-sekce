import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { Config } from "src/config";
import { PhotoFacesMatchingService } from "src/models/albums/services/photo-faces-matching.service";
import { PhotoFacesNotificationsService } from "src/models/albums/services/photo-faces-notifications.service";
import { FacesDetectionService } from "../services/faces-detection.service";
import { PhotoContentService } from "../services/photo-content.service";
import { PhotoThumbnailsService } from "../services/photo-thumbnails.service";
import { BACKEND_SCHEDULE_QUEUE, BackendScheduleJobs } from "../worker-queues";

@Processor(BACKEND_SCHEDULE_QUEUE)
export class BackendScheduleProcessor extends WorkerHost implements OnModuleInit {
	private logger = new Logger(BackendScheduleProcessor.name);

	constructor(
		@InjectQueue(BACKEND_SCHEDULE_QUEUE) private queue: Queue,
		private facesDetectionService: FacesDetectionService,
		private photoContentService: PhotoContentService,
		private photoThumbnailsService: PhotoThumbnailsService,
		private photoFacesMatchingService: PhotoFacesMatchingService,
		private photoFacesNotificationsService: PhotoFacesNotificationsService,
		private config: Config,
	) {
		super();
	}

	async onModuleInit() {
		const tz = this.config.faces.timezone;

		await this.queue.upsertJobScheduler(
			BackendScheduleJobs.facesEnqueue,
			{ pattern: this.config.faces.cron, tz },
			{ name: BackendScheduleJobs.facesEnqueue, opts: { removeOnComplete: true, removeOnFail: 100 } },
		);

		await this.queue.upsertJobScheduler(
			BackendScheduleJobs.facesStop,
			{ pattern: this.config.faces.stopCron, tz },
			{ name: BackendScheduleJobs.facesStop, opts: { removeOnComplete: true, removeOnFail: 100 } },
		);

		await this.queue.upsertJobScheduler(
			BackendScheduleJobs.facesMatch,
			{ pattern: this.config.faces.matchCron, tz },
			{ name: BackendScheduleJobs.facesMatch, opts: { removeOnComplete: true, removeOnFail: 100 } },
		);

		await this.queue.upsertJobScheduler(
			BackendScheduleJobs.facesNotify,
			{ pattern: this.config.faces.notifyCron, tz },
			{ name: BackendScheduleJobs.facesNotify, opts: { removeOnComplete: true, removeOnFail: 100 } },
		);

		await this.queue.upsertJobScheduler(
			BackendScheduleJobs.photosEmbedEnqueue,
			{ pattern: this.config.faces.cron, tz },
			{ name: BackendScheduleJobs.photosEmbedEnqueue, opts: { removeOnComplete: true, removeOnFail: 100 } },
		);

		await this.queue.upsertJobScheduler(
			BackendScheduleJobs.photosEmbedStop,
			{ pattern: this.config.faces.stopCron, tz },
			{ name: BackendScheduleJobs.photosEmbedStop, opts: { removeOnComplete: true, removeOnFail: 100 } },
		);

		await this.queue.upsertJobScheduler(
			BackendScheduleJobs.photosThumbnailsEnqueue,
			{ pattern: this.config.photos.thumbnailsCron, tz },
			{ name: BackendScheduleJobs.photosThumbnailsEnqueue, opts: { removeOnComplete: true, removeOnFail: 100 } },
		);

		this.logger.log(
			`Missing photo thumbnails scheduled at "${this.config.photos.thumbnailsCron}", face detection scheduled at "${this.config.faces.cron}" until "${this.config.faces.stopCron}" (${tz}), ${this.config.faces.batchSize} photos per night, face matching at "${this.config.faces.matchCron}", new photos notifications at "${this.config.faces.notifyCron}", ${this.config.photoContent.batchSize} photos per night for content recognition.`,
		);
	}

	async process(job: Job) {
		switch (job.name) {
			case BackendScheduleJobs.facesEnqueue:
				return this.facesDetectionService.enqueueBatch();
			case BackendScheduleJobs.facesStop:
				return this.facesDetectionService.stopBatch();
			case BackendScheduleJobs.facesMatch:
				return this.photoFacesMatchingService.matchAll();
			case BackendScheduleJobs.facesNotify:
				return this.photoFacesNotificationsService.notifyNewPhotos();
			case BackendScheduleJobs.photosEmbedEnqueue:
				return this.photoContentService.enqueueBatch();
			case BackendScheduleJobs.photosEmbedStop:
				return this.photoContentService.stopBatch();
			case BackendScheduleJobs.photosThumbnailsEnqueue:
				return this.photoThumbnailsService.enqueueBatch();
			default:
				this.logger.warn(`Unknown scheduled job "${job.name}".`);
		}
	}
}
