import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { FacesDetectedResult } from "src/models/albums/schema/detected-faces";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { WORKER_RESULTS_QUEUE, WorkerResults } from "../worker-queues";

@Processor(WORKER_RESULTS_QUEUE)
export class WorkerResultsProcessor extends WorkerHost {
	private logger = new Logger(WorkerResultsProcessor.name);

	constructor(private photoFacesService: PhotoFacesService) {
		super();
	}

	async process(job: Job) {
		switch (job.name) {
			case WorkerResults.facesDetected:
				return this.photoFacesService.saveDetectedFaces(job.data as FacesDetectedResult);
			default:
				this.logger.warn(`Unknown worker result "${job.name}".`);
		}
	}
}
