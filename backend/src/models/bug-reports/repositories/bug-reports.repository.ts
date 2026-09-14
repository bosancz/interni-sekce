import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { BugReport } from "../entities/bug-report.entity";

export interface BugReportData {
	userId: number;
	repo: string;
	issueNumber: number;
	title: string;
}

@Injectable()
export class BugReportsRepository {
	constructor(@InjectRepository(BugReport) private repository: Repository<BugReport>) {}

	async createBugReport(data: BugReportData) {
		await this.repository.createQueryBuilder().insert().values(data).orIgnore().execute();
	}

	async listBugReports(userId: number, limit = 100) {
		return this.repository.find({
			where: { userId },
			order: { createdAt: "DESC", id: "DESC" },
			take: limit,
		});
	}

	async getUnnotifiedBugReports(repo: string, issueNumbers: number[]) {
		if (!issueNumbers.length) return [];

		return this.repository.find({
			where: { repo, issueNumber: In(issueNumbers), notifiedAt: IsNull() },
			relations: { user: true },
			order: { issueNumber: "ASC" },
		});
	}

	async markNotified(ids: number[]) {
		if (!ids.length) return;
		await this.repository.update({ id: In(ids) }, { notifiedAt: new Date() });
	}
}
