import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { Config } from "src/config";
import { WorkerHeartbeat, WorkerStatus } from "../schema/worker-heartbeat";
import { WORKER_HEARTBEAT_PREFIX } from "../worker-queues";

const STALE_AFTER_MS = 25_000;

@Injectable()
export class WorkersService implements OnModuleDestroy {
	private redis: Redis;

	constructor(config: Config) {
		this.redis = new Redis(config.redis.url, { lazyConnect: true, maxRetriesPerRequest: 2 });
	}

	onModuleDestroy() {
		this.redis.disconnect();
	}

	async ping(): Promise<void> {
		await this.redis.ping();
	}

	async getWorkers(): Promise<WorkerHeartbeat[]> {
		const keys: string[] = [];
		let cursor = "0";

		do {
			const [next, batch] = await this.redis.scan(cursor, "MATCH", `${WORKER_HEARTBEAT_PREFIX}*`, "COUNT", 100);
			cursor = next;
			keys.push(...batch);
		} while (cursor !== "0");

		if (!keys.length) return [];

		const values = await this.redis.mget(keys);
		const now = Date.now();

		return values
			.filter((value): value is string => !!value)
			.map((value) => JSON.parse(value) as WorkerHeartbeat)
			.map((worker) =>
				now - new Date(worker.updatedAt).getTime() > STALE_AFTER_MS
					? { ...worker, status: WorkerStatus.stale }
					: worker,
			)
			.sort((a, b) => a.id.localeCompare(b.id));
	}
}
