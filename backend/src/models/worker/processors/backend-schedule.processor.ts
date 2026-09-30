import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { Config } from "src/config";
import { FacesDetectionService } from "../services/faces-detection.service";
import { BACKEND_SCHEDULE_QUEUE, BackendScheduleJobs } from "../worker-queues";

@Processor(BACKEND_SCHEDULE_QUEUE)
export class BackendScheduleProcessor extends WorkerHost implements OnModuleInit {
	private logger = new Logger(BackendScheduleProcessor.name);

	constructor(
		@InjectQueue(BACKEND_SCHEDULE_QUEUE) private queue: Queue,
		private facesDetectionService: FacesDetectionService,
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

		this.logger.log(
			`Face detection scheduled at "${this.config.faces.cron}" until "${this.config.faces.stopCron}" (${tz}), ${this.config.faces.batchSize} photos per night.`,
		);
	}

	async process(job: Job) {
		switch (job.name) {
			case BackendScheduleJobs.facesEnqueue:
				return this.facesDetectionService.enqueueBatch();
			case BackendScheduleJobs.facesStop:
				return this.facesDetectionService.stopBatch();
			default:
				this.logger.warn(`Unknown scheduled job "${job.name}".`);
		}
	}
}
