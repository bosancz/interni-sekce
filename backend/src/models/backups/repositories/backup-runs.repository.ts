import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BackupRun } from "../entities/backup-run.entity";
import { BackupSchedule } from "../entities/backup-schedule.entity";
import { BackupRunStatuses, BackupRunTypes } from "../schema/backup-run";

@Injectable()
export class BackupRunsRepository {
	constructor(
		@InjectRepository(BackupRun) private repository: Repository<BackupRun>,
		@InjectRepository(BackupSchedule) private schedules: Repository<BackupSchedule>,
	) {}

	async listRuns(limit = 60) {
		return this.repository.find({ order: { startedAt: "DESC", id: "DESC" }, take: limit });
	}

	async getLastRun(type: BackupRunTypes) {
		return this.repository.findOne({ where: { type }, order: { startedAt: "DESC", id: "DESC" } });
	}

	async getLastSuccess(type: BackupRunTypes) {
		return this.repository.findOne({
			where: { type, status: BackupRunStatuses.ok },
			order: { finishedAt: "DESC", id: "DESC" },
		});
	}

	async getSchedule() {
		return this.schedules.findOne({ where: { id: 1 } });
	}
}
