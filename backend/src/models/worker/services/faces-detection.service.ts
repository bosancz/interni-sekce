import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { Config } from "src/config";
import { Photo } from "src/models/albums/entities/photo.entity";
import { DetectFacesJob } from "src/models/albums/schema/detected-faces";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { BACKEND_SCHEDULE_QUEUE, BackendScheduleJobs, WORKER_TASK_QUEUE, WorkerTasks } from "../worker-queues";

@Injectable()
export class FacesDetectionService {
	private logger = new Logger(FacesDetectionService.name);

	constructor(
		@InjectQueue(WORKER_TASK_QUEUE(WorkerTasks.detectFaces)) private queue: Queue<DetectFacesJob>,
		@InjectQueue(BACKEND_SCHEDULE_QUEUE) private scheduleQueue: Queue,
		private photoFacesService: PhotoFacesService,
		private config: Config,
	) {}

	async enqueueBatch(limit: number = this.config.faces.batchSize) {
		const photos = await this.photoFacesService.getPhotosForDetection(limit);

		const count = await this.enqueuePhotos(photos);

		this.logger.log(`Queued ${count} photos for face detection.`);

		return count;
	}

	async enqueuePhotos(photos: Photo[]) {
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

		return jobs.length;
	}

	async stopBatch() {
		const waiting = await this.queue.getWaitingCount();
		await this.queue.drain(true);

		this.logger.log(`Face detection window closed, ${waiting} photos left for the next night.`);
	}

	async getQueueStatus() {
		const [counts, enqueue, stop, match] = await Promise.all([
			this.queue.getJobCounts("waiting", "active", "delayed", "failed"),
			this.scheduleQueue.getJobScheduler(BackendScheduleJobs.facesEnqueue),
			this.scheduleQueue.getJobScheduler(BackendScheduleJobs.facesStop),
			this.scheduleQueue.getJobScheduler(BackendScheduleJobs.facesMatch),
		]);

		return {
			waiting: counts.waiting ?? 0,
			active: counts.active ?? 0,
			delayed: counts.delayed ?? 0,
			failed: counts.failed ?? 0,
			nextBatchAt: enqueue?.next ? new Date(enqueue.next) : null,
			nextStopAt: stop?.next ? new Date(stop.next) : null,
			nextMatchAt: match?.next ? new Date(match.next) : null,
		};
	}
}
