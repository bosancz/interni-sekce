export enum WorkerTasks {
	detectFaces = "detect-faces",
}

export const WORKER_TASK_QUEUE = (task: WorkerTasks) => `worker-${task}`;

export const WORKER_RESULTS_QUEUE = "worker-results";

export const BACKEND_SCHEDULE_QUEUE = "backend-schedule";

export enum WorkerResults {
	facesDetected = "faces-detected",
}

export enum BackendScheduleJobs {
	facesEnqueue = "faces-enqueue",
	facesStop = "faces-stop",
	facesMatch = "faces-match",
	facesNotify = "faces-notify",
}

export const WORKER_HEARTBEAT_PREFIX = "worker-heartbeat:";
