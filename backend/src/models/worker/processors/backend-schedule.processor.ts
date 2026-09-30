import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { Config } from "src/config";
import { PhotoFacesMatchingService } from "src/models/albums/services/photo-faces-matching.service";
import { FacesDetectionService } from "../services/faces-detection.service";
import { BACKEND_SCHEDULE_QUEUE, BackendScheduleJobs } from "../worker-queues";

@Processor(BACKEND_SCHEDULE_QUEUE)
export class BackendScheduleProcessor extends WorkerHost implements OnModuleInit {
	private logger = new Logger(BackendScheduleProcessor.name);

	constructor(
		@InjectQueue(BACKEND_SCHEDULE_QUEUE) private queue: Queue,
		private facesDetectionService: FacesDetectionService,
		private photoFacesMatchingService: PhotoFacesMatchingService,
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

		this.logger.log(
			`Face detection scheduled at "${this.config.faces.cron}" until "${this.config.faces.stopCron}" (${tz}), ${this.config.faces.batchSize} photos per night, face matching at "${this.config.faces.matchCron}".`,
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
			default:
				this.logger.warn(`Unknown scheduled job "${job.name}".`);
		}
	}
}
