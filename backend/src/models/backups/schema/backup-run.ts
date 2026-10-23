export enum BackupRunTypes {
	database = "database",
	files = "files",
}

export enum BackupRunStatuses {
	running = "running",
	ok = "ok",
	error = "error",
}

export interface BackupRunProgress {
	bytes: number;
	totalBytes: number;
	transfers: number;
	totalTransfers: number;
	checks: number;
	speed: number;
	eta: number | null;
	elapsed: number;
	updatedAt: string;
}
