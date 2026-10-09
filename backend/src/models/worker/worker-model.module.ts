import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Module } from "@nestjs/common";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { FacesEnqueueCommand } from "./commands/faces-enqueue.command";
import { PhotosEmbedCommand } from "./commands/photos-embed.command";
import { BackendScheduleProcessor } from "./processors/backend-schedule.processor";
import { WorkerResultsProcessor } from "./processors/worker-results.processor";
import { FacesDetectionService } from "./services/faces-detection.service";
import { PhotoContentService } from "./services/photo-content.service";
import { RegistrationRenderService } from "./services/registration-render.service";
import { WorkersService } from "./services/workers.service";
import { BACKEND_SCHEDULE_QUEUE, WORKER_RESULTS_QUEUE, WORKER_TASK_QUEUE, WorkerTasks } from "./worker-queues";

@Module({})
export class WorkerModelModule {
	static forRoot(options: { processors: boolean }): DynamicModule {
		return {
			module: WorkerModelModule,
			global: true,
			imports: [
				BullModule.registerQueue(
					{ name: WORKER_TASK_QUEUE(WorkerTasks.detectFaces) },
					{ name: WORKER_TASK_QUEUE(WorkerTasks.embedPhoto) },
					{ name: WORKER_TASK_QUEUE(WorkerTasks.embedText) },
					{ name: WORKER_TASK_QUEUE(WorkerTasks.renderRegistration) },
					{ name: WORKER_RESULTS_QUEUE },
					{ name: BACKEND_SCHEDULE_QUEUE },
				),
				AlbumsModelModule,
			],
			exports: [FacesDetectionService, PhotoContentService, RegistrationRenderService, WorkersService],
			providers: [
				FacesDetectionService,
				PhotoContentService,
				RegistrationRenderService,
				WorkersService,
				...(options.processors
					? [BackendScheduleProcessor, WorkerResultsProcessor]
					: [FacesEnqueueCommand, PhotosEmbedCommand]),
			],
		};
	}
}
