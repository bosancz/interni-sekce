import {
	Body,
	Controller,
	Delete,
	Get,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Post,
	Req,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MemberAchievementTypes } from "src/models/members/entities/member-achievements.entity";
import { MemberAchievementTitles } from "src/models/members/helpers/member-badge-titles";
import { MemberAchievementsRepository } from "src/models/members/repositories/member-achievements.repository";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { MemberBadgeChangeKind } from "src/models/notifications/schema/member-badge-change";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import {
	MemberAchievementCreatePermission,
	MemberAchievementDeletePermission,
	MemberAchievementsListPermission,
} from "../acl/member-achievements.acl";
import { MemberAchievementCreateBody, MemberAchievementResponse } from "../dto/member-achievement.dto";

@Controller("members/:memberId/achievements")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberAchievementsController {
	private readonly logger = new Logger(MemberAchievementsController.name);

	constructor(
		private membersRepository: MembersRepository,
		private memberAchievements: MemberAchievementsRepository,
		private notificationsService: NotificationsService,
	) {}

	@Get()
	@AcLinks(MemberAchievementsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberAchievementResponse), isArray: true })
	async listMemberAchievements(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
	): Promise<MemberAchievementResponse[]> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberAchievementsListPermission.canOrThrow(req, member);

		return this.memberAchievements.getAchievements(member.id);
	}

	@Post()
	@AcLinks(MemberAchievementCreatePermission)
	@ApiResponse({ type: WithLinks(MemberAchievementResponse) })
	async createMemberAchievement(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Body() body: MemberAchievementCreateBody,
	): Promise<MemberAchievementResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberAchievementCreatePermission.canOrThrow(req, member);

		const achievement = await this.memberAchievements.createAchievement(member.id, body.type);

		this.notifyChanges(req, member.id, [achievement.type], "added");

		return achievement;
	}

	@Delete(":achievementId")
	@AcLinks(MemberAchievementDeletePermission)
	async deleteMemberAchievement(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Param("achievementId", ParseIntPipe) achievementId: number,
	): Promise<void> {
		const achievement = await this.memberAchievements.getAchievement(memberId, achievementId);
		if (!achievement) throw new NotFoundException();

		MemberAchievementDeletePermission.canOrThrow(req, achievement);

		const types = await this.memberAchievements.deleteAchievement(achievement);

		this.notifyChanges(req, memberId, types, "removed");
	}

	private notifyChanges(
		req: Request,
		memberId: number,
		types: MemberAchievementTypes[],
		kind: MemberBadgeChangeKind,
	) {
		for (const type of types) {
			this.notificationsService
				.onMemberBadgeChanged(
					memberId,
					{ category: "achievement", kind, title: MemberAchievementTitles[type] },
					req.user?.userId,
				)
				.catch((err) => this.logger.error(`Failed to send achievement notification: ${err.message}`));
		}
	}
}
