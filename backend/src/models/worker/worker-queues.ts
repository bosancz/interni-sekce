export enum WorkerTasks {
	detectFaces = "detect-faces",
	embedPhoto = "embed-photo",
	embedText = "embed-text",
	matchFaces = "match-faces",
}

export const WORKER_TASK_QUEUE = (task: WorkerTasks) => `worker-${task}`;

export const WORKER_RESULTS_QUEUE = "worker-results";

export const BACKEND_SCHEDULE_QUEUE = "backend-schedule";

export enum WorkerResults {
	facesDetected = "faces-detected",
	photoEmbedded = "photo-embedded",
}

export enum BackendScheduleJobs {
	facesEnqueue = "faces-enqueue",
	facesStop = "faces-stop",
	facesMatch = "faces-match",
	facesNotify = "faces-notify",
	photosEmbedEnqueue = "photos-embed-enqueue",
	photosEmbedStop = "photos-embed-stop",
}

export const WORKER_HEARTBEAT_PREFIX = "worker-heartbeat:";
