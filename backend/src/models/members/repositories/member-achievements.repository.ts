import { ConflictException, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, QueryFailedError, Repository } from "typeorm";
import { MemberAchievement, MemberAchievementTypes } from "../entities/member-achievements.entity";

const ACHIEVEMENT_ORDER = Object.values(MemberAchievementTypes);

const STAR_TYPES = [
	MemberAchievementTypes.hvezda1,
	MemberAchievementTypes.hvezda2,
	MemberAchievementTypes.hvezda3,
	MemberAchievementTypes.hvezda4,
];

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
		if (STAR_TYPES.includes(type)) {
			const hasNovackovskaZkouska = await this.memberAchievements.exists({
				where: { memberId, type: MemberAchievementTypes.novackovskaZkouska },
			});
			if (!hasNovackovskaZkouska)
				throw new UnprocessableEntityException("Hvězda jde přidat až po nováčkovské zkoušce.");
		}

		try {
			return await this.memberAchievements.save({ type, memberId });
		} catch (err) {
			if (err instanceof QueryFailedError && (err as QueryFailedError & { code?: string }).code === "23505") {
				throw new ConflictException("Člen už toto ocenění má.");
			}
			throw err;
		}
	}

	async deleteAchievement(achievement: MemberAchievement) {
		await this.memberAchievements.delete({ id: achievement.id, memberId: achievement.memberId });
		if (achievement.type !== MemberAchievementTypes.novackovskaZkouska) return [achievement.type];

		const stars = await this.memberAchievements.find({
			where: { memberId: achievement.memberId, type: In(STAR_TYPES) },
		});
		if (stars.length) await this.memberAchievements.delete({ id: In(stars.map((star) => star.id)) });

		return [achievement.type, ...stars.map((star) => star.type)];
	}
}
