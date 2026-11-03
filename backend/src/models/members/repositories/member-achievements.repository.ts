import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { MemberAchievement, MemberAchievementTypes } from "../entities/member-achievements.entity";

const ACHIEVEMENT_ORDER = Object.values(MemberAchievementTypes);

@Injectable()
export class MemberAchievementsRepository {
	constructor(@InjectRepository(MemberAchievement) private memberAchievements: Repository<MemberAchievement>) {}

	async getAchievements(memberId: number) {
		const achievements = await this.memberAchievements.find({ where: { memberId } });
		return achievements.sort((a, b) => ACHIEVEMENT_ORDER.indexOf(a.type) - ACHIEVEMENT_ORDER.indexOf(b.type));
	}

	async getAchievement(memberId: number, achievementId: number) {
		return this.memberAchievements.findOne({ where: { id: achievementId, memberId } });
	}

	async createAchievement(memberId: number, type: MemberAchievementTypes) {
		try {
			return await this.memberAchievements.save({ type, memberId });
		} catch (err) {
			if (err instanceof QueryFailedError && (err as QueryFailedError & { code?: string }).code === "23505") {
				throw new ConflictException("Člen už toto ocenění má.");
			}
			throw err;
		}
	}

	async deleteAchievement(memberId: number, achievementId: number) {
		await this.memberAchievements.delete({ id: achievementId, memberId });
	}
}
