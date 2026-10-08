import { Injectable, Logger, Optional } from "@nestjs/common";
import { WorkersService } from "src/models/worker/services/workers.service";
import { DataSource } from "typeorm";
import { HealthResponse, HealthStatus } from "../dto/health-response";

const CHECK_TIMEOUT_MS = 3000;

@Injectable()
export class HealthService {
	private readonly logger = new Logger(HealthService.name);

	constructor(
		private dataSource: DataSource,
		@Optional() private workersService?: WorkersService,
	) {}

	async getHealth(): Promise<HealthResponse> {
		const [database, redis] = await Promise.all([
			this.check("database", () => this.dataSource.query("SELECT 1")),
			this.workersService ? this.check("redis", () => this.workersService!.ping()) : HealthStatus.disabled,
		]);

		const status = [database, redis].includes(HealthStatus.error) ? HealthStatus.error : HealthStatus.ok;

		return { status, database, redis };
	}

	private async check(name: string, fn: () => Promise<unknown>): Promise<HealthStatus> {
		let timeout: NodeJS.Timeout | undefined;
		try {
			await Promise.race([
				fn(),
				new Promise((_, reject) => {
					timeout = setTimeout(() => reject(new Error("timeout")), CHECK_TIMEOUT_MS);
				}),
			]);
			return HealthStatus.ok;
		} catch (err) {
			this.logger.warn(`Health check of ${name} failed: ${err instanceof Error ? err.message : err}`);
			return HealthStatus.error;
		} finally {
			clearTimeout(timeout);
		}
	}
}
