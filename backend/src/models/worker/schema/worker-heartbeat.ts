export enum WorkerStatus {
	idle = "idle",
	busy = "busy",
	stale = "stale",
}

export interface WorkerCurrentJob {
	task: string;
	jobId: string | null;
	startedAt: string;
}

export interface WorkerHeartbeat {
	id: string;
	hostname: string;
	status: WorkerStatus;
	tasks: string[];
	current: WorkerCurrentJob | null;
	cpus: number;
	cpuLimit: number | null;
	memoryLimit: number | null;
	memoryUsage: number | null;
	processed: number;
	failed: number;
	lastJobAt: string | null;
	startedAt: string;
	updatedAt: string;
}
