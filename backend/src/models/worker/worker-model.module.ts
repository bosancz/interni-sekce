import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Module } from "@nestjs/common";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { BadgesModelModule } from "src/models/badges/badges-model.module";
import { FacesEnqueueCommand } from "./commands/faces-enqueue.command";
import { PhotosEmbedCommand } from "./commands/photos-embed.command";
import { BackendScheduleProcessor } from "./processors/backend-schedule.processor";
import { WorkerResultsProcessor } from "./processors/worker-results.processor";
import { FacesDetectionService } from "./services/faces-detection.service";
import { PhotoContentService } from "./services/photo-content.service";
import { ServerStatsService } from "./services/server-stats.service";
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
					{ name: WORKER_RESULTS_QUEUE },
					{ name: BACKEND_SCHEDULE_QUEUE },
				),
				AlbumsModelModule,
				BadgesModelModule,
			],
			exports: [FacesDetectionService, PhotoContentService, ServerStatsService, WorkersService],
			providers: [
				FacesDetectionService,
				PhotoContentService,
				ServerStatsService,
				WorkersService,
				...(options.processors
					? [BackendScheduleProcessor, WorkerResultsProcessor]
					: [FacesEnqueueCommand, PhotosEmbedCommand]),
			],
		};
	}
}
