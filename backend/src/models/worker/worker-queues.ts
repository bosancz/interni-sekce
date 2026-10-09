export enum WorkerTasks {
	detectFaces = "detect-faces",
	embedPhoto = "embed-photo",
	embedText = "embed-text",
	photoThumbnails = "photo-thumbnails",
}

export const WORKER_TASK_QUEUE = (task: WorkerTasks) => `worker-${task}`;

export const WORKER_RESULTS_QUEUE = "worker-results";

export const BACKEND_SCHEDULE_QUEUE = "backend-schedule";

export enum WorkerResults {
	facesDetected = "faces-detected",
	photoEmbedded = "photo-embedded",
	photoThumbnailsCreated = "photo-thumbnails-created",
}

export enum BackendScheduleJobs {
	facesEnqueue = "faces-enqueue",
	facesStop = "faces-stop",
	facesMatch = "faces-match",
	facesNotify = "faces-notify",
	photosEmbedEnqueue = "photos-embed-enqueue",
	photosEmbedStop = "photos-embed-stop",
	photosThumbnailsEnqueue = "photos-thumbnails-enqueue",
}

export const WORKER_HEARTBEAT_PREFIX = "worker-heartbeat:";
