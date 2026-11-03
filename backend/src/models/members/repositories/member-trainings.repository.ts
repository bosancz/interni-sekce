import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Member } from "../entities/member.entity";
import { MemberTraining } from "../entities/member-training.entity";

export type MemberTrainingData = Partial<Pick<MemberTraining, "type" | "name" | "issuedOn" | "validUntil" | "issuer">>;

@Injectable()
export class MemberTrainingsRepository {
	constructor(@InjectRepository(MemberTraining) private memberTrainings: Repository<MemberTraining>) {}

	async getTrainings(memberId: number) {
		return this.memberTrainings
			.createQueryBuilder("training")
			.where("training.memberId = :memberId", { memberId })
			.orderBy("training.type", "ASC")
			.addOrderBy("training.validUntil", "DESC", "NULLS FIRST")
			.addOrderBy("training.issuedOn", "DESC", "NULLS LAST")
			.addOrderBy("training.id", "DESC")
			.getMany();
	}

	async getTraining(memberId: number, trainingId: number) {
		return this.memberTrainings.findOne({ where: { id: trainingId, memberId } });
	}

	async createTraining(memberId: number, data: MemberTrainingData) {
		return this.memberTrainings.save({ ...data, memberId });
	}

	async createTrainingsForMembers(memberIds: number[], data: MemberTrainingData) {
		return this.memberTrainings.manager.transaction(async (manager) => {
			const ids = [...new Set(memberIds)];
			const existing = await manager.count(Member, { where: { id: In(ids) } });
			if (existing !== ids.length) return null;

			return manager.save(
				MemberTraining,
				ids.map((memberId) => manager.create(MemberTraining, { ...data, memberId })),
			);
		});
	}

	async updateTraining(training: MemberTraining, data: MemberTrainingData) {
		return this.memberTrainings.save({ ...training, ...data });
	}

	async deleteTraining(memberId: number, trainingId: number) {
		await this.memberTrainings.delete({ id: trainingId, memberId });
	}
}
