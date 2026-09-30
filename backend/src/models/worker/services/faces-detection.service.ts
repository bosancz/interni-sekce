import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { Config } from "src/config";
import { DetectFacesJob } from "src/models/albums/schema/detected-faces";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { WORKER_TASK_QUEUE, WorkerTasks } from "../worker-queues";

@Injectable()
export class FacesDetectionService {
	private logger = new Logger(FacesDetectionService.name);

	constructor(
		@InjectQueue(WORKER_TASK_QUEUE(WorkerTasks.detectFaces)) private queue: Queue<DetectFacesJob>,
		private photoFacesService: PhotoFacesService,
		private config: Config,
	) {}

	async enqueueBatch(limit: number = this.config.faces.batchSize) {
		const photos = await this.photoFacesService.getPhotosForDetection(limit);

		const jobs: DetectFacesJob[] = [];

		for (const photo of photos) {
			const job = await this.photoFacesService.getDetectionJob(photo);

			if (job) jobs.push(job);
			else await this.photoFacesService.markDetectionFailed(photo.id, null, "Image file not found.");
		}

		await this.queue.addBulk(
			jobs.map((data) => ({
				name: WorkerTasks.detectFaces,
				data,
				opts: {
					jobId: `${WorkerTasks.detectFaces}-${data.photoId}`,
					attempts: 3,
					backoff: { type: "exponential", delay: 60_000 },
					removeOnComplete: true,
					removeOnFail: true,
				},
			})),
		);

		this.logger.log(`Queued ${jobs.length} photos for face detection.`);

		return jobs.length;
	}

	async stopBatch() {
		const waiting = await this.queue.getWaitingCount();
		await this.queue.drain(true);

		this.logger.log(`Face detection window closed, ${waiting} photos left for the next night.`);
	}
}
