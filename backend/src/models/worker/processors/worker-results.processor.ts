import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { FacesDetectedResult } from "src/models/albums/schema/detected-faces";
import { PhotoEmbeddedResult } from "src/models/albums/schema/photo-embeddings";
import { PhotoEmbeddingsService } from "src/models/albums/services/photo-embeddings.service";
import { PhotoFacesMatchingService } from "src/models/albums/services/photo-faces-matching.service";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { PhotoThumbnailsResult } from "src/models/albums/schema/photo-thumbnails";
import { PhotoThumbnailsService } from "../services/photo-thumbnails.service";
import { WORKER_RESULTS_QUEUE, WorkerResults } from "../worker-queues";

@Processor(WORKER_RESULTS_QUEUE)
export class WorkerResultsProcessor extends WorkerHost {
	private logger = new Logger(WorkerResultsProcessor.name);

	constructor(
		private photoFacesService: PhotoFacesService,
		private photoFacesMatchingService: PhotoFacesMatchingService,
		private photoEmbeddingsService: PhotoEmbeddingsService,
		private photoThumbnailsService: PhotoThumbnailsService,
	) {
		super();
	}

	async process(job: Job) {
		switch (job.name) {
			case WorkerResults.facesDetected: {
				const result = job.data as FacesDetectedResult;
				await this.photoFacesService.saveDetectedFaces(result);
				if (result.error === undefined) await this.photoFacesMatchingService.matchPhoto(result.photoId);
				return;
			}
			case WorkerResults.photoThumbnailsCreated:
				return this.photoThumbnailsService.saveResult(job.data as PhotoThumbnailsResult);
			case WorkerResults.photoEmbedded:
				return this.photoEmbeddingsService.saveEmbedding(job.data as PhotoEmbeddedResult);
			default:
				this.logger.warn(`Unknown worker result "${job.name}".`);
		}
	}
}
