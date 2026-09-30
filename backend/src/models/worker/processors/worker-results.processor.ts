import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { FacesDetectedResult } from "src/models/albums/schema/detected-faces";
import { PhotoFacesMatchingService } from "src/models/albums/services/photo-faces-matching.service";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { WORKER_RESULTS_QUEUE, WorkerResults } from "../worker-queues";

@Processor(WORKER_RESULTS_QUEUE)
export class WorkerResultsProcessor extends WorkerHost {
	private logger = new Logger(WorkerResultsProcessor.name);

	constructor(
		private photoFacesService: PhotoFacesService,
		private photoFacesMatchingService: PhotoFacesMatchingService,
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
			default:
				this.logger.warn(`Unknown worker result "${job.name}".`);
		}
	}
}
