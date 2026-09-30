import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Logger, Module } from "@nestjs/common";
import { StaticConfig } from "src/config";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { FacesEnqueueCommand } from "./commands/faces-enqueue.command";
import { BackendScheduleProcessor } from "./processors/backend-schedule.processor";
import { WorkerResultsProcessor } from "./processors/worker-results.processor";
import { FacesDetectionService } from "./services/faces-detection.service";
import { BACKEND_SCHEDULE_QUEUE, WORKER_RESULTS_QUEUE, WORKER_TASK_QUEUE, WorkerTasks } from "./worker-queues";

@Module({})
export class WorkerModelModule {
	static forRoot(options: { processors: boolean }): DynamicModule {
		if (!StaticConfig.redis.url) {
			if (options.processors) {
				new Logger(WorkerModelModule.name).warn("REDIS_URL is not set, face detection is disabled.");
			}
			return { module: WorkerModelModule };
		}

		return {
			module: WorkerModelModule,
			imports: [
				BullModule.forRoot({ connection: { url: StaticConfig.redis.url } }),
				BullModule.registerQueue(
					{ name: WORKER_TASK_QUEUE(WorkerTasks.detectFaces) },
					{ name: WORKER_RESULTS_QUEUE },
					{ name: BACKEND_SCHEDULE_QUEUE },
				),
				AlbumsModelModule,
			],
			providers: [
				FacesDetectionService,
				...(options.processors ? [BackendScheduleProcessor, WorkerResultsProcessor] : [FacesEnqueueCommand]),
			],
		};
	}
}
