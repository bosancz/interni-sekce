import { Injectable } from "@nestjs/common";
import { cpus, freemem, totalmem, uptime } from "os";

const MIN_SAMPLE_MS = 1_000;

interface CpuSample {
	at: number;
	total: number;
	idle: number;
}

export interface ServerStats {
	cpus: number;
	cpuUsage: number | null;
	memoryTotal: number;
	memoryAvailable: number;
	uptime: number;
}

@Injectable()
export class ServerStatsService {
	private sample = this.sampleCpu();
	private cpuUsage: number | null = null;

	getStats(): ServerStats {
		return {
			cpus: cpus().length,
			cpuUsage: this.getCpuUsage(),
			memoryTotal: totalmem(),
			memoryAvailable: freemem(),
			uptime: Math.round(uptime()),
		};
	}

	private getCpuUsage() {
		const sample = this.sampleCpu();
		if (sample.at - this.sample.at < MIN_SAMPLE_MS) return this.cpuUsage;

		const total = sample.total - this.sample.total;
		const idle = sample.idle - this.sample.idle;
		this.sample = sample;

		if (total > 0) this.cpuUsage = Math.round(Math.min(1, Math.max(0, 1 - idle / total)) * 1000) / 1000;
		return this.cpuUsage;
	}

	private sampleCpu(): CpuSample {
		let total = 0;
		let idle = 0;
		for (const cpu of cpus()) {
			total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
			idle += cpu.times.idle;
		}
		return { at: Date.now(), total, idle };
	}
}
