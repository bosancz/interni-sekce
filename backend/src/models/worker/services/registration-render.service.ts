import { InjectQueue } from "@nestjs/bullmq";
import {
	BadGatewayException,
	GatewayTimeoutException,
	Injectable,
	Logger,
	OnModuleDestroy,
	ServiceUnavailableException,
} from "@nestjs/common";
import { Queue, QueueEvents } from "bullmq";
import { Config } from "src/config";
import { RenderRegistrationJob, RenderRegistrationResult } from "../schema/render-registration";
import { WorkerStatus } from "../schema/worker-heartbeat";
import { WORKER_TASK_QUEUE, WorkerTasks } from "../worker-queues";
import { WorkersService } from "./workers.service";

@Injectable()
export class RegistrationRenderService implements OnModuleDestroy {
	private logger = new Logger(RegistrationRenderService.name);

	private events?: QueueEvents;

	constructor(
		@InjectQueue(WORKER_TASK_QUEUE(WorkerTasks.renderRegistration)) private queue: Queue<RenderRegistrationJob>,
		private workersService: WorkersService,
		private config: Config,
	) {}

	async onModuleDestroy() {
		await this.events?.close();
	}

	async render(data: RenderRegistrationJob): Promise<RenderRegistrationResult> {
		const workers = await this.workersService.getWorkers();
		const available = workers.some(
			(worker) => worker.status !== WorkerStatus.stale && worker.tasks.includes(WorkerTasks.renderRegistration),
		);
		if (!available) {
			throw new ServiceUnavailableException(
				"Přihlášku teď nelze vygenerovat, neběží worker, který ji vykresluje. Zkus to prosím později.",
			);
		}

		this.events ??= new QueueEvents(this.queue.name, { connection: { url: this.config.redis.url } });
		await this.events.waitUntilReady();

		const job = await this.queue.add(WorkerTasks.renderRegistration, data, {
			removeOnComplete: { age: 60 },
			removeOnFail: { age: 3600 },
		});

		try {
			return await job.waitUntilFinished(this.events, this.config.registrations.renderTimeoutMs);
		} catch (err) {
			this.logger.warn(`Registration rendering failed: ${err}`);
			await job.remove().catch(() => undefined);
			if (err instanceof Error && err.message.includes("timed out")) {
				throw new GatewayTimeoutException(
					"Vykreslení přihlášky se nepodařilo, worker neodpověděl. Zkus to prosím znovu.",
				);
			}
			throw new BadGatewayException("Vykreslení přihlášky ve workeru selhalo.");
		}
	}
}
