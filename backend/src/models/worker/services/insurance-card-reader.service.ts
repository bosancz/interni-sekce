import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue, QueueEvents } from "bullmq";
import { DateTime } from "luxon";
import { relative, resolve, sep } from "path";
import { Config } from "src/config";
import { pickInsuranceCardExpiration } from "src/models/members/helpers/insurance-card-expiration";
import { ReadInsuranceCardJob, ReadInsuranceCardResult } from "../schema/insurance-card";
import { WorkerStatus } from "../schema/worker-heartbeat";
import { WORKER_TASK_QUEUE, WorkerTasks } from "../worker-queues";
import { WorkersService } from "./workers.service";

@Injectable()
export class InsuranceCardReaderService implements OnModuleDestroy {
	private logger = new Logger(InsuranceCardReaderService.name);

	private events?: QueueEvents;

	constructor(
		@InjectQueue(WORKER_TASK_QUEUE(WorkerTasks.readInsuranceCard)) private queue: Queue<ReadInsuranceCardJob>,
		private workersService: WorkersService,
		private config: Config,
	) {}

	async onModuleDestroy() {
		await this.events?.close();
	}

	async readExpiration(memberId: number, path: string, birthday: string | null | undefined) {
		try {
			if (!(await this.isWorkerAvailable())) {
				this.logger.warn(
					`No worker reads insurance cards, member ${memberId} keeps the expiration unrecognized.`,
				);
				return null;
			}

			const result = await this.readCard(memberId, path);
			if (result.error) this.logger.warn(`Insurance card of member ${memberId}: ${result.error}`);

			const today = DateTime.now().setZone(this.config.insuranceCards.timezone).toISODate()!;
			return pickInsuranceCardExpiration(result.dates, birthday, today);
		} catch (err) {
			this.logger.warn(`Reading insurance card of member ${memberId} failed: ${err}`);
			return null;
		}
	}

	private async isWorkerAvailable() {
		const workers = await this.workersService.getWorkers();
		return workers.some(
			(worker) => worker.status !== WorkerStatus.stale && worker.tasks.includes(WorkerTasks.readInsuranceCard),
		);
	}

	private async readCard(memberId: number, path: string): Promise<ReadInsuranceCardResult> {
		const relativePath = relative(resolve(this.config.fs.dataDir), path);
		if (relativePath.startsWith(".." + sep) || relativePath === "..") {
			throw new Error("Insurance card is stored outside DATA_DIR, the worker cannot read it.");
		}

		this.events ??= new QueueEvents(this.queue.name, { connection: { url: this.config.redis.url } });
		await this.events.waitUntilReady();

		const job = await this.queue.add(
			WorkerTasks.readInsuranceCard,
			{ memberId, path: relativePath.split(sep).join("/") },
			{ removeOnComplete: { age: 60 }, removeOnFail: { age: 3600 } },
		);

		try {
			return await job.waitUntilFinished(this.events, this.config.insuranceCards.timeoutMs);
		} catch (err) {
			await job.remove().catch(() => undefined);
			throw err;
		}
	}
}
