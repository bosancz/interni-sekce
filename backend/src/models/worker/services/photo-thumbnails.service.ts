import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { relative, resolve, sep } from "path";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Config } from "src/config";
import { Photo } from "src/models/albums/entities/photo.entity";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { PhotoThumbnailsJob, PhotoThumbnailsResult } from "src/models/albums/schema/photo-thumbnails";
import { PhotoThumbnailSize, PhotosFilesService } from "src/models/albums/services/photos-files.service";
import { WorkerStatus } from "../schema/worker-heartbeat";
import { WORKER_TASK_QUEUE, WorkerTasks } from "../worker-queues";
import { FacesDetectionService } from "./faces-detection.service";
import { PhotoContentService } from "./photo-content.service";
import { WorkersService } from "./workers.service";

@Injectable()
export class PhotoThumbnailsService {
	private logger = new Logger(PhotoThumbnailsService.name);

	constructor(
		@InjectQueue(WORKER_TASK_QUEUE(WorkerTasks.photoThumbnails)) private queue: Queue<PhotoThumbnailsJob>,
		private photos: PhotosRepository,
		private photosFilesService: PhotosFilesService,
		private workersService: WorkersService,
		private facesDetectionService: FacesDetectionService,
		private photoContentService: PhotoContentService,
		private config: Config,
	) {}

	async processUploadedPhoto(photo: Photo): Promise<Photo> {
		try {
			if (await this.isWorkerAvailable()) {
				const rejected = await this.enqueuePhotos([photo]);
				if (!rejected.length) return photo;
			}
		} catch (err) {
			this.logger.warn(`Failed to queue thumbnails of photo ${photo.id}, creating them in the request: ${err}`);
		}

		const updated = await this.createLocally(photo);

		this.enqueueFollowUps(updated).catch((err) =>
			this.logger.error(`Failed to queue photo ${photo.id} for face detection and content recognition.`, err),
		);

		return updated;
	}

	async enqueueBatch(limit: number = this.config.photos.thumbnailsBatchSize) {
		const photos = await this.photos.getPhotosWithoutThumbnails(limit);
		if (!photos.length) return 0;

		const local = (await this.isWorkerAvailable()) ? await this.enqueuePhotos(photos) : photos;

		for (const photo of local) await this.enqueueFollowUps(await this.createLocally(photo));

		this.logger.log(
			`Queued ${photos.length - local.length} photos without thumbnails for the worker, created ${local.length} in the backend.`,
		);

		return photos.length;
	}

	async saveResult(result: PhotoThumbnailsResult) {
		const photo = await this.photos.getPhoto(result.photoId);
		if (!photo) return;

		if (result.error !== undefined) {
			this.logger.warn(
				`Worker failed to create thumbnails of photo ${photo.id}, trying in the backend: ${result.error}`,
			);
			return this.enqueueFollowUps(await this.createLocally(photo));
		}

		const thumbnails = Object.fromEntries(
			Object.entries(result.thumbnails).map(([size, data]) => [size, Buffer.from(data, "base64")]),
		) as Partial<Record<PhotoThumbnailSize, Buffer>>;

		await this.photosFilesService.saveThumbnails(photo, thumbnails);

		const state = { bg: result.bg, thumbnailsAt: new Date(), thumbnailsError: null };
		await this.photos.setThumbnailsState(photo.id, state);

		await this.enqueueFollowUps({ ...photo, ...state });
	}

	private async createLocally(photo: Photo): Promise<Photo> {
		await this.queue.remove(this.getJobId(photo.id)).catch(() => undefined);

		let state: Pick<Photo, "bg" | "thumbnailsAt" | "thumbnailsError">;

		try {
			const { bg } = await this.photosFilesService.createThumbnails(photo);
			state = { bg, thumbnailsAt: new Date(), thumbnailsError: null };
		} catch (err) {
			this.logger.error(`Failed to create thumbnails of photo ${photo.id}: ${err}`);
			state = { bg: photo.bg, thumbnailsAt: new Date(), thumbnailsError: String(err).slice(0, 1000) };
		}

		await this.photos.setThumbnailsState(photo.id, state);

		return { ...photo, ...state };
	}

	private async enqueuePhotos(photos: Photo[]): Promise<Photo[]> {
		const jobs: PhotoThumbnailsJob[] = [];
		const rejected: Photo[] = [];

		for (const photo of photos) {
			const job = await this.getJob(photo);

			if (job) jobs.push(job);
			else rejected.push(photo);
		}

		await this.queue.addBulk(
			jobs.map((data) => ({
				name: WorkerTasks.photoThumbnails,
				data,
				opts: {
					jobId: this.getJobId(data.photoId),
					attempts: 3,
					backoff: { type: "exponential", delay: 10_000 },
					removeOnComplete: true,
					removeOnFail: true,
				},
			})),
		);

		return rejected;
	}

	private async getJob(photo: Photo): Promise<PhotoThumbnailsJob | null> {
		const path = this.photosFilesService.getPhotoImagePath(photo, PhotoSizes.original);

		try {
			await this.photosFilesService.fileExists(path);
		} catch {
			return null;
		}

		const relativePath = relative(resolve(this.config.fs.dataDir), path);
		if (relativePath.startsWith(".." + sep) || relativePath === "..") return null;

		return { photoId: photo.id, path: relativePath.split(sep).join("/"), sizes: this.config.photos.sizes };
	}

	private getJobId(photoId: Photo["id"]) {
		return `${WorkerTasks.photoThumbnails}-${photoId}`;
	}

	private async enqueueFollowUps(photo: Photo) {
		await Promise.all([
			this.facesDetectionService.enqueuePhotos([photo]),
			this.photoContentService.enqueuePhotos([photo]),
		]);
	}

	private async isWorkerAvailable() {
		const workers = await this.workersService.getWorkers();

		return workers.some(
			(worker) => worker.status !== WorkerStatus.stale && worker.tasks.includes(WorkerTasks.photoThumbnails),
		);
	}
}
