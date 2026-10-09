import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue, QueueEvents } from "bullmq";
import { randomUUID } from "crypto";
import { Redis } from "ioredis";
import { Config } from "src/config";
import { WorkerStatus } from "src/models/worker/schema/worker-heartbeat";
import { WorkersService } from "src/models/worker/services/workers.service";
import { WORKER_TASK_QUEUE, WorkerTasks } from "src/models/worker/worker-queues";
import {
	FaceMatchingJobRunner,
	FaceMatchingWorkerRun,
	joinVectors,
	VectorFaceReference,
	vectorDimensions,
} from "../helpers/face-matching-worker";
import { MatchFacesJob, MatchFacesResult } from "../schema/detected-faces";

const KEYS_TTL_S = 3600;
const JOB_TIMEOUT_MS = 120_000;

@Injectable()
export class FaceMatchingWorkerService implements FaceMatchingJobRunner, OnModuleDestroy {
	private events?: QueueEvents;
	private redis: Redis;

	constructor(
		@InjectQueue(WORKER_TASK_QUEUE(WorkerTasks.matchFaces)) private queue: Queue<MatchFacesJob, MatchFacesResult>,
		private workersService: WorkersService,
		private config: Config,
	) {
		this.redis = new Redis(config.redis.url, { lazyConnect: true, maxRetriesPerRequest: 2 });
	}

	async onModuleDestroy() {
		await this.events?.close();
		this.redis.disconnect();
	}

	async isAvailable() {
		const workers = await this.workersService.getWorkers();
		return workers.some(
			(worker) => worker.status !== WorkerStatus.stale && worker.tasks.includes(WorkerTasks.matchFaces),
		);
	}

	async start(references: VectorFaceReference[]): Promise<FaceMatchingWorkerRun> {
		if (!(await this.isAvailable())) throw new Error(`No worker runs the ${WorkerTasks.matchFaces} task.`);

		const dimensions = references.length ? vectorDimensions(references[0].descriptor) : 0;
		const valid = references.filter((reference) => vectorDimensions(reference.descriptor) === dimensions);

		const run = new FaceMatchingWorkerRun(
			this,
			randomUUID(),
			dimensions,
			valid.map((reference) => reference.memberId),
		);

		await this.redis.set(
			run.referencesKey,
			joinVectors(valid.map((reference) => reference.descriptor)),
			"EX",
			KEYS_TTL_S,
		);

		return run;
	}

	async runJob(run: FaceMatchingWorkerRun, name: string, data: { faces: Buffer[]; excluded: [number, number][] }) {
		this.events ??= new QueueEvents(this.queue.name, { connection: { url: this.config.redis.url } });
		await this.events.waitUntilReady();

		const facesKey = `${this.queue.name}:${name}`;
		await this.redis.set(facesKey, joinVectors(data.faces), "EX", KEYS_TTL_S);

		try {
			const job = await this.queue.add(
				WorkerTasks.matchFaces,
				{
					dimensions: run.dimensions,
					referencesKey: run.referencesKey,
					referenceMemberIds: run.referenceMemberIds,
					facesKey,
					excluded: data.excluded,
				},
				{ removeOnComplete: { age: 60 }, removeOnFail: { age: 3600 } },
			);

			try {
				const result: MatchFacesResult = await job.waitUntilFinished(this.events, JOB_TIMEOUT_MS);
				if (result.memberIds.length !== data.faces.length)
					throw new Error("Worker returned a wrong number of faces.");
				return result;
			} catch (err) {
				await job.remove().catch(() => undefined);
				throw err;
			}
		} finally {
			await this.deleteKeys([facesKey]);
		}
	}

	async deleteKeys(keys: string[]) {
		await this.redis.del(...keys);
	}
}
