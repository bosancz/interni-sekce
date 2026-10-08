import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue, QueueEvents } from "bullmq";
import { Config } from "src/config";
import { Photo } from "src/models/albums/entities/photo.entity";
import { EmbedPhotoJob, EmbedTextJob, EmbedTextResult } from "src/models/albums/schema/photo-embeddings";
import { PhotoEmbeddingsService } from "src/models/albums/services/photo-embeddings.service";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { BACKEND_SCHEDULE_QUEUE, BackendScheduleJobs, WORKER_TASK_QUEUE, WorkerTasks } from "../worker-queues";

const TEXT_CACHE_SIZE = 500;

@Injectable()
export class PhotoContentService implements OnModuleDestroy {
	private logger = new Logger(PhotoContentService.name);

	private textEvents?: QueueEvents;
	private textCache = new Map<string, number[]>();
	private lastTextModel: string | null = null;

	constructor(
		@InjectQueue(WORKER_TASK_QUEUE(WorkerTasks.embedPhoto)) private queue: Queue<EmbedPhotoJob>,
		@InjectQueue(WORKER_TASK_QUEUE(WorkerTasks.embedText)) private textQueue: Queue<EmbedTextJob>,
		@InjectQueue(BACKEND_SCHEDULE_QUEUE) private scheduleQueue: Queue,
		private photoEmbeddingsService: PhotoEmbeddingsService,
		private photoFacesService: PhotoFacesService,
		private config: Config,
	) {}

	async onModuleDestroy() {
		await this.textEvents?.close();
	}

	async enqueueBatch(limit: number = this.config.photoContent.batchSize) {
		const photos = await this.photoEmbeddingsService.getPhotosForEmbedding(limit);

		const count = await this.enqueuePhotos(photos);

		this.logger.log(`Queued ${count} photos for content embedding.`);

		return count;
	}

	async enqueuePhotos(photos: Photo[]) {
		const jobs: EmbedPhotoJob[] = [];

		for (const photo of photos) {
			const job = await this.photoFacesService.getDetectionJob(photo);

			if (job) jobs.push(job);
			else await this.photoEmbeddingsService.markEmbeddingFailed(photo.id, null, "Image file not found.");
		}

		await this.queue.addBulk(
			jobs.map((data) => ({
				name: WorkerTasks.embedPhoto,
				data,
				opts: {
					jobId: `${WorkerTasks.embedPhoto}-${data.photoId}`,
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

		this.logger.log(`Content embedding window closed, ${waiting} photos left for the next night.`);
	}

	async embedText(text: string) {
		const [embedding] = await this.embedTexts([text]);
		return embedding;
	}

	async embedTexts(texts: string[]) {
		const keys = texts.map((text) => text.trim().toLocaleLowerCase("cs"));
		const missing = [...new Set(keys.filter((key) => !this.textCache.has(key)))];

		if (missing.length) {
			const result = await this.runTextJob(missing);
			missing.forEach((key, i) => this.cacheText(key, result.embeddings[i]));
		}

		return keys.map((key) => {
			const embedding = this.textCache.get(key)!;
			this.cacheText(key, embedding);
			return embedding;
		});
	}

	get textModel() {
		return this.lastTextModel;
	}

	private async runTextJob(texts: string[]) {
		this.textEvents ??= new QueueEvents(this.textQueue.name, { connection: { url: this.config.redis.url } });
		await this.textEvents.waitUntilReady();

		const job = await this.textQueue.add(
			WorkerTasks.embedText,
			{ texts },
			{ removeOnComplete: { age: 60 }, removeOnFail: { age: 3600 } },
		);

		try {
			const result: EmbedTextResult = await job.waitUntilFinished(
				this.textEvents,
				this.config.photoContent.textTimeoutMs,
			);
			this.lastTextModel = result.model;
			return result;
		} catch (err) {
			await job.remove().catch(() => undefined);
			throw err;
		}
	}

	private cacheText(key: string, embedding: number[]) {
		this.textCache.delete(key);
		this.textCache.set(key, embedding);
		if (this.textCache.size > TEXT_CACHE_SIZE) this.textCache.delete(this.textCache.keys().next().value!);
	}

	async getQueueStatus() {
		const [counts, enqueue, stop] = await Promise.all([
			this.queue.getJobCounts("waiting", "active", "delayed", "failed"),
			this.scheduleQueue.getJobScheduler(BackendScheduleJobs.photosEmbedEnqueue),
			this.scheduleQueue.getJobScheduler(BackendScheduleJobs.photosEmbedStop),
		]);

		return {
			waiting: counts.waiting ?? 0,
			active: counts.active ?? 0,
			delayed: counts.delayed ?? 0,
			failed: counts.failed ?? 0,
			nextBatchAt: enqueue?.next ? new Date(enqueue.next) : null,
			nextStopAt: stop?.next ? new Date(stop.next) : null,
		};
	}
}
